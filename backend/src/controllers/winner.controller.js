import { pool } from "../config/database.js";

function mapWinner(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id,
    contestId: row.contest_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerRut: row.customer_rut,
    totalPoints: Number(row.total_points || 0),
    drawReason: row.draw_reason,
    selectedAt: row.selected_at,
  };
}

function getBusinessIdFromRequest(req) {
  return Number(req.businessId || req.query.businessId || req.body?.businessId || 1);
}

async function getActiveContest(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      business_id,
      title,
      target_points,
      end_date,
      status,
      winner_selected
    FROM contests
    WHERE business_id = ?
      AND status = 'active'
    ORDER BY end_date ASC, id DESC
    LIMIT 1
    `,
    [businessId]
  );

  return rows[0] || null;
}

async function getLatestWinnerByBusiness(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      business_id,
      contest_id,
      customer_id,
      customer_name,
      customer_rut,
      total_points,
      draw_reason,
      selected_at
    FROM winners
    WHERE business_id = ?
    ORDER BY selected_at DESC, id DESC
    LIMIT 1
    `,
    [businessId]
  );

  return rows[0] || null;
}

async function getWinnerByContest(businessId, contestId) {
  if (!contestId) {
    return null;
  }

  const [rows] = await pool.query(
    `
    SELECT
      id,
      business_id,
      contest_id,
      customer_id,
      customer_name,
      customer_rut,
      total_points,
      draw_reason,
      selected_at
    FROM winners
    WHERE business_id = ?
      AND contest_id = ?
    ORDER BY selected_at DESC, id DESC
    LIMIT 1
    `,
    [businessId, contestId]
  );

  return rows[0] || null;
}

async function getEligibleCustomersForContest(businessId, contestId, targetPoints) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id AS customer_id,
      c.name AS customer_name,
      c.rut AS customer_rut,
      COALESCE(SUM(p.points_generated), 0) AS total_points
    FROM purchases p
    INNER JOIN customers c
      ON c.id = p.customer_id
    WHERE p.business_id = ?
      AND p.contest_id = ?
      AND c.active = 1
    GROUP BY c.id, c.name, c.rut
    HAVING total_points >= ?
    ORDER BY c.id ASC
    `,
    [businessId, contestId, Number(targetPoints || 0)]
  );

  return rows;
}

function pickRandomWinner(customers) {
  if (!Array.isArray(customers) || customers.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * customers.length);

  return customers[randomIndex];
}

export async function getAdminWinner(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const winner = await getLatestWinnerByBusiness(businessId);

    res.json({
      ok: true,
      data: {
        winner: mapWinner(winner),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicWinner(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const activeContest = await getActiveContest(businessId);

    let winner = null;

    if (activeContest) {
      winner = await getWinnerByContest(businessId, activeContest.id);
    }

    if (!winner) {
      winner = await getLatestWinnerByBusiness(businessId);
    }

    res.json({
      ok: true,
      data: {
        winner: mapWinner(winner),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function autoDrawPublicWinner(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const businessId = getBusinessIdFromRequest(req);
    const activeContest = await getActiveContest(businessId);

    if (!activeContest) {
      return res.json({
        ok: true,
        data: {
          winner: null,
          status: "no_active_contest",
          message: "No existe sorteo activo.",
        },
      });
    }

    const existingWinner = await getWinnerByContest(businessId, activeContest.id);

    if (existingWinner) {
      return res.json({
        ok: true,
        data: {
          winner: mapWinner(existingWinner),
          status: "already_selected",
          message: "El ganador ya fue seleccionado.",
        },
      });
    }

    const endDate = new Date(activeContest.end_date);
    const now = new Date();

    if (Number.isNaN(endDate.getTime()) || now < endDate) {
      return res.json({
        ok: true,
        data: {
          winner: null,
          status: "contest_still_running",
          message: "El sorteo aún no termina.",
        },
      });
    }

    const eligibleCustomers = await getEligibleCustomersForContest(
      businessId,
      activeContest.id,
      activeContest.target_points || 0
    );

    if (!eligibleCustomers.length) {
      await connection.beginTransaction();

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
        [activeContest.id, businessId]
      );

      await connection.commit();

      return res.json({
        ok: true,
        data: {
          winner: null,
          status: "no_eligible_customers",
          message: "No hubo clientes habilitados para el sorteo.",
        },
      });
    }

    const selectedCustomer = pickRandomWinner(eligibleCustomers);

    await connection.beginTransaction();

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
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        businessId,
        activeContest.id,
        selectedCustomer.customer_id,
        selectedCustomer.customer_name,
        selectedCustomer.customer_rut,
        selectedCustomer.total_points,
        "fecha_final",
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
      [activeContest.id, businessId]
    );

    await connection.commit();

    const winner = {
      id: insertResult.insertId,
      business_id: businessId,
      contest_id: activeContest.id,
      customer_id: selectedCustomer.customer_id,
      customer_name: selectedCustomer.customer_name,
      customer_rut: selectedCustomer.customer_rut,
      total_points: selectedCustomer.total_points,
      draw_reason: "fecha_final",
      selected_at: new Date(),
    };

    return res.json({
      ok: true,
      data: {
        winner: mapWinner(winner),
        status: "winner_selected",
        message: "Ganador seleccionado correctamente.",
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}