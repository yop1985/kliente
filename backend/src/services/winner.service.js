import { pool } from "../config/database.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

async function getExistingWinner(connection, businessId, contestId) {
  const [rows] = await connection.query(
    `
    SELECT
      w.id,
      w.business_id AS businessId,
      w.contest_id AS contestId,
      w.customer_id AS customerId,
      w.customer_name AS customerName,
      w.customer_rut AS customerRut,
      w.total_points AS totalPoints,
      w.draw_reason AS drawReason,
      w.selected_at AS selectedAt
    FROM winners w
    WHERE w.business_id = ?
      AND w.contest_id = ?
    ORDER BY w.selected_at DESC, w.id DESC
    LIMIT 1
    `,
    [businessId, contestId]
  );

  return rows[0] || null;
}

async function getContestForDraw(connection, businessId, contestId = null) {
  const params = [businessId];

  let contestIdFilter = "";

  if (contestId) {
    contestIdFilter = "AND id = ?";
    params.push(contestId);
  }

  const [rows] = await connection.query(
    `
    SELECT
      id,
      business_id AS businessId,
      title,
      end_date AS endDate,
      target_points AS targetPoints,
      status,
      winner_selected AS winnerSelected
    FROM contests
    WHERE business_id = ?
      ${contestIdFilter}
    ORDER BY
      CASE WHEN status = 'active' THEN 0 ELSE 1 END,
      end_date ASC,
      id ASC
    LIMIT 1
    `,
    params
  );

  return rows[0] || null;
}

async function getContestPointStats(connection, businessId, contestId) {
  const [rows] = await connection.query(
    `
    SELECT
      c.id AS customerId,
      c.name AS customerName,
      c.rut AS customerRut,
      COALESCE(SUM(p.points_generated), 0) AS totalPoints
    FROM purchases p
    INNER JOIN customers c
      ON c.id = p.customer_id
    WHERE p.business_id = ?
      AND p.contest_id = ?
      AND c.active = 1
    GROUP BY c.id, c.name, c.rut
    HAVING totalPoints > 0
    ORDER BY totalPoints DESC, c.id ASC
    `,
    [businessId, contestId]
  );

  return rows;
}

async function pickRandomEligibleCustomer({
  connection,
  businessId,
  contestId,
  minimumPoints = 1,
}) {
  const [rows] = await connection.query(
    `
    SELECT
      c.id AS customerId,
      c.name AS customerName,
      c.rut AS customerRut,
      COALESCE(SUM(p.points_generated), 0) AS totalPoints
    FROM purchases p
    INNER JOIN customers c
      ON c.id = p.customer_id
    WHERE p.business_id = ?
      AND p.contest_id = ?
      AND c.active = 1
    GROUP BY c.id, c.name, c.rut
    HAVING totalPoints >= ?
    ORDER BY RAND()
    LIMIT 1
    `,
    [businessId, contestId, minimumPoints]
  );

  return rows[0] || null;
}

export async function getLatestWinnerForBusiness(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      w.id,
      w.business_id AS businessId,
      w.contest_id AS contestId,
      co.title AS contestTitle,
      w.customer_id AS customerId,
      w.customer_name AS customerName,
      w.customer_rut AS customerRut,
      w.total_points AS totalPoints,
      w.draw_reason AS drawReason,
      w.selected_at AS selectedAt
    FROM winners w
    INNER JOIN contests co
      ON co.id = w.contest_id
    WHERE w.business_id = ?
    ORDER BY w.selected_at DESC, w.id DESC
    LIMIT 1
    `,
    [businessId]
  );

  return rows[0] || null;
}

export async function drawWinnerForContest({
  businessId,
  contestId = null,
  force = false,
  reason = "auto_end_date",
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const contest = await getContestForDraw(connection, businessId, contestId);

    if (!contest) {
      await connection.rollback();

      return {
        selected: false,
        reason: "contest_not_found",
        message: "No se encontró concurso para sortear",
        winner: null,
      };
    }

    const existingWinner = await getExistingWinner(
      connection,
      businessId,
      contest.id
    );

    if (existingWinner) {
      await connection.rollback();

      return {
        selected: false,
        reason: "winner_already_selected",
        message: "Este concurso ya tiene ganador",
        winner: existingWinner,
      };
    }

    const now = new Date();
    const endDate = contest.endDate ? new Date(contest.endDate) : null;
    const endedByDate = endDate ? endDate.getTime() <= now.getTime() : false;

    if (!force && !endedByDate) {
      await connection.rollback();

      return {
        selected: false,
        reason: "countdown_not_finished",
        message: "El sorteo todavía no se puede ejecutar. El contador no ha llegado a cero.",
        winner: null,
      };
    }

    const pointStats = await getContestPointStats(
      connection,
      businessId,
      contest.id
    );

    if (!pointStats.length) {
      await connection.rollback();

      return {
        selected: false,
        reason: "no_participants",
        message: "No hay clientes participantes con puntos para sortear",
        winner: null,
      };
    }

    const targetPoints = toNumber(contest.targetPoints, 0);

    const minimumPointsToParticipate = targetPoints > 0 ? targetPoints : 1;

    const eligibleCustomers = pointStats.filter(
      (item) => toNumber(item.totalPoints, 0) >= minimumPointsToParticipate
    );

    if (!eligibleCustomers.length) {
      await connection.rollback();

      return {
        selected: false,
        reason: "no_eligible_participants",
        message:
          targetPoints > 0
            ? "El contador terminó, pero ningún cliente alcanzó la meta de puntos."
            : "El contador terminó, pero no hay clientes habilitados para el sorteo.",
        winner: null,
        rules: {
          targetPoints,
          minimumPointsToParticipate,
          eligibleParticipants: 0,
        },
      };
    }

    const selectedCustomer = await pickRandomEligibleCustomer({
      connection,
      businessId,
      contestId: contest.id,
      minimumPoints: minimumPointsToParticipate,
    });

    if (!selectedCustomer) {
      await connection.rollback();

      return {
        selected: false,
        reason: "no_eligible_participants",
        message: "No hay participantes disponibles para el sorteo",
        winner: null,
      };
    }

    const drawReason = endedByDate ? "auto_end_date" : reason;

    const [insertResult] = await connection.query(
      `
      INSERT INTO winners (
        business_id,
        contest_id,
        customer_id,
        customer_name,
        customer_rut,
        total_points,
        draw_reason,
        selected_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        businessId,
        contest.id,
        selectedCustomer.customerId,
        selectedCustomer.customerName,
        selectedCustomer.customerRut,
        toNumber(selectedCustomer.totalPoints, 0),
        drawReason,
      ]
    );

    await connection.query(
      `
      UPDATE contests
      SET
        winner_selected = 1,
        status = 'finished',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND business_id = ?
      `,
      [contest.id, businessId]
    );

    await connection.commit();

    return {
      selected: true,
      reason: drawReason,
      message: "Ganador seleccionado automáticamente al finalizar el contador",
      winner: {
        id: insertResult.insertId,
        businessId,
        contestId: contest.id,
        contestTitle: contest.title,
        customerId: selectedCustomer.customerId,
        customerName: selectedCustomer.customerName,
        customerRut: selectedCustomer.customerRut,
        totalPoints: toNumber(selectedCustomer.totalPoints, 0),
        drawReason,
        selectedAt: new Date().toISOString(),
      },
      rules: {
        targetPoints,
        minimumPointsToParticipate,
        eligibleParticipants: eligibleCustomers.length,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function autoDrawWinnerIfReady(businessId) {
  return drawWinnerForContest({
    businessId,
    force: false,
    reason: "auto_end_date",
  });
}