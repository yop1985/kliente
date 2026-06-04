import { pool } from "../config/database.js";

function mapContestHistory(row) {
  return {
    contestId: row.contest_id,
    title: row.title,
    description: row.description,
    prizeTitle: row.prize_title,
    productName: row.product_name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    winnerSelected: Boolean(row.winner_selected),
    purchasesCount: Number(row.purchases_count || 0),
    participantsCount: Number(row.participants_count || 0),
    totalPoints: Number(row.total_points || 0),
    winner: row.winner_id
      ? {
          id: row.winner_id,
          customerName: row.customer_name,
          customerRut: row.customer_rut,
          totalPoints: Number(row.winner_total_points || 0),
          drawReason: row.draw_reason,
          selectedAt: row.selected_at,
        }
      : null,
  };
}

export async function getContestHistory(req, res, next) {
  try {
    const businessId = req.businessId;

    const [rows] = await pool.query(
      `
      SELECT
        co.id AS contest_id,
        co.title,
        co.description,
        co.prize_title,
        co.product_name,
        co.start_date,
        co.end_date,
        co.status,
        co.winner_selected,

        COALESCE(stats.purchases_count, 0) AS purchases_count,
        COALESCE(stats.participants_count, 0) AS participants_count,
        COALESCE(stats.total_points, 0) AS total_points,

        w.id AS winner_id,
        w.customer_name,
        w.customer_rut,
        w.total_points AS winner_total_points,
        w.draw_reason,
        w.selected_at
      FROM contests co
      LEFT JOIN (
        SELECT
          contest_id,
          COUNT(*) AS purchases_count,
          COUNT(DISTINCT customer_id) AS participants_count,
          SUM(points_generated) AS total_points
        FROM purchases
        WHERE business_id = ?
        GROUP BY contest_id
      ) stats
        ON stats.contest_id = co.id
      LEFT JOIN winners w
        ON w.contest_id = co.id
      WHERE co.business_id = ?
      ORDER BY co.id DESC
      `,
      [businessId, businessId]
    );

    res.json({
      ok: true,
      data: rows.map(mapContestHistory),
    });
  } catch (error) {
    next(error);
  }
}