import { pool } from "../config/database.js";

function getBusinessIdFromRequest(req) {
  return Number(req.businessId || 0);
}

function buildPublicBusinessBlockedPayload(business) {
  const status = business.status || (business.active ? "active" : "suspended");

  if (status === "cancelled") {
    return {
      ok: false,
      code: "BUSINESS_CANCELLED",
      message: "Servicio cancelado. Contactar a Mitnick Connect.",
      details:
        business.suspended_reason ||
        "El servicio público de este comercio no se encuentra disponible.",
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        status,
      },
      support: {
        email: "mitnickconnect@gmail.com",
        whatsapp: "+56 9 4969 1796",
      },
      copyright: "© by Mitnick-Connect",
    };
  }

  return {
    ok: false,
    code: "BUSINESS_SUSPENDED",
    message: "Servicio temporalmente no disponible.",
    details:
      business.suspended_reason ||
      "Este comercio se encuentra temporalmente suspendido.",
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status,
    },
    support: {
      email: "mitnickconnect@gmail.com",
      whatsapp: "+56 9 4969 1796",
    },
    copyright: "© by Mitnick-Connect",
  };
}

async function getBusinessAccessById(businessId) {
  if (!businessId) {
    return {
      ok: false,
      statusCode: 404,
      payload: {
        ok: false,
        code: "BUSINESS_NOT_FOUND",
        message: "Negocio no encontrado",
      },
      business: null,
    };
  }

  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      slug,
      active,
      status,
      suspended_reason
    FROM businesses
    WHERE id = ?
    LIMIT 1
    `,
    [businessId]
  );

  if (!rows.length) {
    return {
      ok: false,
      statusCode: 404,
      payload: {
        ok: false,
        code: "BUSINESS_NOT_FOUND",
        message: "Negocio no encontrado",
      },
      business: null,
    };
  }

  const business = rows[0];
  const status = business.status || (business.active ? "active" : "suspended");

  if (!business.active || status === "suspended" || status === "cancelled") {
    return {
      ok: false,
      statusCode: 403,
      payload: buildPublicBusinessBlockedPayload({
        ...business,
        status,
      }),
      business,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    payload: null,
    business: {
      ...business,
      status,
    },
  };
}

async function getActiveContest(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      title,
      description,
      prize_title AS prizeTitle,
      prize_description AS prizeDescription,
      contest_period AS contestPeriod,
      product_name AS productName,
      start_date AS startDate,
      end_date AS endDate,
      minimum_purchase_amount AS minimumPurchaseAmount,
      minimum_purchase_kg AS minimumPurchaseKg,
      points_per_purchase AS pointsPerPurchase,
      target_points AS targetPoints,
      status,
      winner_selected AS winnerSelected
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

async function getRankingForContest(businessId, contestId) {
  if (!contestId) {
    return [];
  }

  const [rows] = await pool.query(
    `
    SELECT
      ROW_NUMBER() OVER (ORDER BY ranked.points DESC, ranked.id ASC) AS position,
      ranked.id,
      ranked.name,
      ranked.rut,
      ranked.phone,
      ranked.points
    FROM (
      SELECT
        c.id,
        c.name,
        c.rut,
        c.phone,
        COALESCE(SUM(p.points_generated), 0) AS points
      FROM purchases p
      INNER JOIN customers c
        ON c.id = p.customer_id
      WHERE p.business_id = ?
        AND p.contest_id = ?
        AND c.active = 1
      GROUP BY c.id, c.name, c.rut, c.phone
      HAVING points > 0
    ) ranked
    ORDER BY ranked.points DESC, ranked.id ASC
    LIMIT 10
    `,
    [businessId, contestId]
  );

  return rows;
}

export async function getPublicBusiness(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        rut,
        address,
        phone,
        email,
        logo_url AS logoUrl
      FROM businesses
      WHERE id = ?
        AND active = 1
      LIMIT 1
      `,
      [businessId]
    );

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        code: "BUSINESS_NOT_FOUND",
        message: "Negocio no encontrado",
      });
    }

    res.json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicContest(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const contest = await getActiveContest(businessId);

    if (!contest) {
      return res.status(404).json({
        ok: false,
        message: "Concurso activo no encontrado",
      });
    }

    res.json({
      ok: true,
      data: contest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicPromotions(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        title,
        description,
        tag,
        priority
      FROM promotions
      WHERE business_id = ?
        AND active = 1
        AND (
          start_date IS NULL
          OR start_date <= NOW()
        )
        AND (
          end_date IS NULL
          OR end_date >= NOW()
        )
      ORDER BY priority ASC, id ASC
      LIMIT 5
      `,
      [businessId]
    );

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicRanking(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const contest = await getActiveContest(businessId);

    const ranking = await getRankingForContest(
      businessId,
      contest?.id || null
    );

    res.json({
      ok: true,
      data: ranking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSocialLinks(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        label,
        url,
        sort_order AS sortOrder
      FROM social_links
      WHERE business_id = ?
        AND active = 1
      ORDER BY sort_order ASC, id ASC
      LIMIT 3
      `,
      [businessId]
    );

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerPublicVisit(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const visitorKey = req.body?.visitorKey || null;

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const userAgent = req.headers["user-agent"] || null;

    await pool.query(
      `
      INSERT INTO public_page_visits (
        business_id,
        visitor_key,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        businessId,
        visitorKey,
        ipAddress,
        userAgent ? userAgent.slice(0, 500) : null,
      ]
    );

    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalVisits
      FROM public_page_visits
      WHERE business_id = ?
      `,
      [businessId]
    );

    res.json({
      ok: true,
      data: {
        totalVisits: Number(countRows[0]?.totalVisits || 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicDashboard(req, res, next) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const access = await getBusinessAccessById(businessId);

    if (!access.ok) {
      return res.status(access.statusCode).json(access.payload);
    }

    const [businessRows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        rut,
        address,
        phone,
        email,
        logo_url AS logoUrl
      FROM businesses
      WHERE id = ?
        AND active = 1
      LIMIT 1
      `,
      [businessId]
    );

    const contest = await getActiveContest(businessId);

    const [promotionRows] = await pool.query(
      `
      SELECT
        id,
        title,
        description,
        tag,
        priority
      FROM promotions
      WHERE business_id = ?
        AND active = 1
        AND (
          start_date IS NULL
          OR start_date <= NOW()
        )
        AND (
          end_date IS NULL
          OR end_date >= NOW()
        )
      ORDER BY priority ASC, id ASC
      LIMIT 5
      `,
      [businessId]
    );

    const rankingRows = await getRankingForContest(
      businessId,
      contest?.id || null
    );

    const [socialRows] = await pool.query(
      `
      SELECT
        id,
        name,
        label,
        url,
        sort_order AS sortOrder
      FROM social_links
      WHERE business_id = ?
        AND active = 1
      ORDER BY sort_order ASC, id ASC
      LIMIT 3
      `,
      [businessId]
    );

    const [visitRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalVisits
      FROM public_page_visits
      WHERE business_id = ?
      `,
      [businessId]
    );

    res.json({
      ok: true,
      data: {
        business: businessRows[0] || null,
        contest,
        promotions: promotionRows,
        ranking: rankingRows,
        socialLinks: socialRows,
        visits: {
          total: Number(visitRows[0]?.totalVisits || 0),
        },
        tenant: {
          businessId,
          slug: req.businessSlug || null,
          name: req.businessName || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}