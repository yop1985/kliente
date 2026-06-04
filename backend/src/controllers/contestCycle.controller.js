import { pool } from "../config/database.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed || fallback;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toMysqlDateTime(value) {
  const date = normalizeDate(value);

  if (!date) {
    return null;
  }

  const pad = (number) => String(number).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function mapContest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    prizeTitle: row.prize_title,
    prizeDescription: row.prize_description,
    contestPeriod: row.contest_period,
    productName: row.product_name,
    startDate: row.start_date,
    endDate: row.end_date,
    minimumPurchaseAmount: row.minimum_purchase_amount,
    minimumPurchaseKg: row.minimum_purchase_kg,
    pointsPerPurchase: row.points_per_purchase,
    targetPoints: row.target_points,
    status: row.status,
    winnerSelected: Boolean(row.winner_selected),
  };
}

export async function createNextContest(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const businessId = req.businessId;

    const title = normalizeString(req.body.title, "Nuevo sorteo");
    const description = normalizeString(
      req.body.description,
      "Participa comprando en el local durante el periodo del sorteo."
    );
    const prizeTitle = normalizeString(req.body.prizeTitle, "Premio del sorteo");
    const prizeDescription = normalizeString(req.body.prizeDescription, "");
    const contestPeriod = normalizeString(req.body.contestPeriod, "monthly");
    const productName = normalizeString(req.body.productName, "Producto del sorteo");

    const now = new Date();

    const startDate =
      toMysqlDateTime(req.body.startDate) || toMysqlDateTime(now);

    const endDate =
      toMysqlDateTime(req.body.endDate) || toMysqlDateTime(addDays(now, 30));

    const minimumPurchaseAmount = toNumber(req.body.minimumPurchaseAmount, 0);
    const minimumPurchaseKg = toNumber(req.body.minimumPurchaseKg, 0);
    const pointsPerPurchase = toNumber(req.body.pointsPerPurchase, 1);
    const targetPoints = toNumber(req.body.targetPoints, 0);

    if (!title) {
      return res.status(400).json({
        ok: false,
        message: "El título del sorteo es obligatorio",
      });
    }

    if (!prizeTitle) {
      return res.status(400).json({
        ok: false,
        message: "El premio del sorteo es obligatorio",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      `
      UPDATE contests
      SET
        status = 'finished',
        updated_at = CURRENT_TIMESTAMP
      WHERE business_id = ?
        AND status = 'active'
      `,
      [businessId]
    );

    const [insertResult] = await connection.query(
      `
      INSERT INTO contests (
        business_id,
        title,
        description,
        prize_title,
        prize_description,
        contest_period,
        product_name,
        start_date,
        end_date,
        minimum_purchase_amount,
        minimum_purchase_kg,
        points_per_purchase,
        target_points,
        status,
        winner_selected,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        businessId,
        title,
        description,
        prizeTitle,
        prizeDescription,
        contestPeriod,
        productName,
        startDate,
        endDate,
        minimumPurchaseAmount,
        minimumPurchaseKg,
        pointsPerPurchase,
        targetPoints,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        business_id,
        title,
        description,
        prize_title,
        prize_description,
        contest_period,
        product_name,
        start_date,
        end_date,
        minimum_purchase_amount,
        minimum_purchase_kg,
        points_per_purchase,
        target_points,
        status,
        winner_selected
      FROM contests
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [insertResult.insertId, businessId]
    );

    await connection.commit();

    res.status(201).json({
      ok: true,
      message: "Próximo sorteo iniciado correctamente",
      data: mapContest(rows[0]),
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}