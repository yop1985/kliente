import { pool } from "../config/database.js";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "kliente.cl";

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

function normalizeNullableString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function mapBusiness(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    publicUrl: row.slug ? `https://${row.slug}.${ROOT_DOMAIN}` : "",
    rut: row.rut,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logoUrl: row.logo_url,
  };
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

function mapPromotion(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tag: row.tag,
    priority: row.priority,
    active: Boolean(row.active),
  };
}

function mapSocialLink(row) {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    url: row.url,
    sortOrder: row.sort_order,
    active: Boolean(row.active),
  };
}

function mapCustomer(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    rut: row.rut,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    totalPoints: Number(row.total_points || 0),
    currentContestPoints: Number(row.current_contest_points || 0),
    active: Boolean(row.active),
  };
}

function mapPurchase(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    contestId: row.contest_id,
    contestTitle: row.contest_title,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerRut: row.customer_rut,
    ticketNumber: row.ticket_number,
    productName: row.product_name,
    totalAmount: Number(row.total_amount || 0),
    totalKg: Number(row.total_kg || 0),
    pointsGenerated: Number(row.points_generated || 0),
    createdAt: row.created_at,
  };
}

async function getActiveContest(businessId) {
  const [rows] = await pool.query(
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
    WHERE business_id = ?
      AND status = 'active'
    ORDER BY end_date ASC, id DESC
    LIMIT 1
    `,
    [businessId]
  );

  return rows[0] || null;
}

async function getBusiness(businessId) {
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
      logo_url
    FROM businesses
    WHERE id = ?
    LIMIT 1
    `,
    [businessId]
  );

  return rows[0] || null;
}

async function getPromotions(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      title,
      description,
      tag,
      priority,
      active
    FROM promotions
    WHERE business_id = ?
    ORDER BY priority ASC, id ASC
    LIMIT 5
    `,
    [businessId]
  );

  return rows;
}

async function getSocialLinks(businessId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      label,
      url,
      sort_order,
      active
    FROM social_links
    WHERE business_id = ?
    ORDER BY sort_order ASC, id ASC
    LIMIT 3
    `,
    [businessId]
  );

  return rows;
}

async function getCustomerRows(businessId, search = "", contestId = null) {
  const params = [businessId];
  let searchFilter = "";

  if (search) {
    searchFilter = `
      AND (
        c.name LIKE ?
        OR c.rut LIKE ?
        OR c.phone LIKE ?
        OR c.email LIKE ?
      )
    `;

    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch, likeSearch);
  }

  const currentContestJoin = contestId
    ? `
      LEFT JOIN (
        SELECT
          customer_id,
          SUM(points_generated) AS current_contest_points
        FROM purchases
        WHERE business_id = ?
          AND contest_id = ?
        GROUP BY customer_id
      ) current_points
        ON current_points.customer_id = c.id
    `
    : `
      LEFT JOIN (
        SELECT
          customer_id,
          0 AS current_contest_points
        FROM purchases
        WHERE 1 = 0
      ) current_points
        ON current_points.customer_id = c.id
    `;

  const currentContestParams = contestId ? [businessId, contestId] : [];

  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.business_id,
      c.name,
      c.rut,
      c.phone,
      c.email,
      c.notes,
      c.total_points,
      COALESCE(current_points.current_contest_points, 0) AS current_contest_points,
      c.active
    FROM customers c
    ${currentContestJoin}
    WHERE c.business_id = ?
      ${searchFilter}
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT 100
    `,
    [...currentContestParams, ...params]
  );

  return rows;
}

async function getPurchaseRows({
  businessId,
  contestId = null,
  customerId = null,
  limit = 100,
}) {
  const params = [businessId];
  let filters = "";

  if (contestId) {
    filters += " AND p.contest_id = ?";
    params.push(contestId);
  }

  if (customerId) {
    filters += " AND p.customer_id = ?";
    params.push(customerId);
  }

  params.push(limit);

  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.business_id,
      p.contest_id,
      co.title AS contest_title,
      p.customer_id,
      c.name AS customer_name,
      c.rut AS customer_rut,
      p.ticket_number,
      p.product_name,
      p.total_amount,
      p.total_kg,
      p.points_generated,
      p.created_at
    FROM purchases p
    INNER JOIN customers c
      ON c.id = p.customer_id
    LEFT JOIN contests co
      ON co.id = p.contest_id
    WHERE p.business_id = ?
      ${filters}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ?
    `,
    params
  );

  return rows;
}

export async function getAdminDashboardData(req, res, next) {
  try {
    const businessId = req.businessId;
    const contest = await getActiveContest(businessId);

    const [
      business,
      promotions,
      socialLinks,
      customers,
      purchases,
      allPurchases,
      visits,
    ] = await Promise.all([
      getBusiness(businessId),
      getPromotions(businessId),
      getSocialLinks(businessId),
      getCustomerRows(businessId, "", contest?.id || null),
      getPurchaseRows({
        businessId,
        contestId: contest?.id || null,
        limit: 100,
      }),
      getPurchaseRows({
        businessId,
        limit: 100,
      }),
      pool.query(
        `
        SELECT COUNT(*) AS total
        FROM public_page_visits
        WHERE business_id = ?
        `,
        [businessId]
      ),
    ]);

    res.json({
      ok: true,
      data: {
        business: mapBusiness(business),
        contest: mapContest(contest),
        promotions: promotions.map(mapPromotion),
        socialLinks: socialLinks.map(mapSocialLink),
        customers: customers.map(mapCustomer),
        purchases: purchases.map(mapPurchase),
        allPurchases: allPurchases.map(mapPurchase),
        visits: {
          total: Number(visits[0][0]?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusiness(req, res, next) {
  try {
    const businessId = req.businessId;

    const name = normalizeString(req.body.name, "");
    const rut = normalizeNullableString(req.body.rut);
    const address = normalizeNullableString(req.body.address);
    const phone = normalizeNullableString(req.body.phone);
    const email = normalizeNullableString(req.body.email);
    const logoUrl = normalizeNullableString(req.body.logoUrl);

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del negocio es obligatorio",
        copyright: "© by Mitnick-Connect",
      });
    }

    await pool.query(
      `
      UPDATE businesses
      SET
        name = ?,
        rut = ?,
        address = ?,
        phone = ?,
        email = ?,
        logo_url = COALESCE(?, logo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [name, rut, address, phone, email, logoUrl, businessId]
    );

    const business = await getBusiness(businessId);

    res.json({
      ok: true,
      data: mapBusiness(business),
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadBusinessLogo(req, res, next) {
  try {
    const businessId = req.businessId;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "No se recibió archivo de logo",
        copyright: "© by Mitnick-Connect",
      });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await pool.query(
      `
      UPDATE businesses
      SET
        logo_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [logoUrl, businessId]
    );

    res.json({
      ok: true,
      data: {
        logoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContest(req, res, next) {
  try {
    const businessId = req.businessId;

    const activeContest = await getActiveContest(businessId);

    if (!activeContest) {
      return res.status(404).json({
        ok: false,
        message: "No existe un concurso activo para editar",
        copyright: "© by Mitnick-Connect",
      });
    }

    const title = normalizeString(req.body.title, "");
    const description = normalizeString(req.body.description, "");
    const prizeTitle = normalizeString(req.body.prizeTitle, "");
    const prizeDescription = normalizeNullableString(req.body.prizeDescription);
    const contestPeriod = normalizeString(req.body.contestPeriod, "monthly");
    const productName = normalizeString(req.body.productName, "");
    const startDate = normalizeString(req.body.startDate, "");
    const endDate = normalizeString(req.body.endDate, "");
    const minimumPurchaseAmount = toNumber(req.body.minimumPurchaseAmount, 0);
    const minimumPurchaseKg = toNumber(req.body.minimumPurchaseKg, 0);
    const pointsPerPurchase = toNumber(req.body.pointsPerPurchase, 1);
    const targetPoints = toNumber(req.body.targetPoints, 0);
    const status = normalizeString(req.body.status, "active");

    if (!title) {
      return res.status(400).json({
        ok: false,
        message: "El título del concurso es obligatorio",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!prizeTitle) {
      return res.status(400).json({
        ok: false,
        message: "El premio del concurso es obligatorio",
        copyright: "© by Mitnick-Connect",
      });
    }

    await pool.query(
      `
      UPDATE contests
      SET
        title = ?,
        description = ?,
        prize_title = ?,
        prize_description = ?,
        contest_period = ?,
        product_name = ?,
        start_date = ?,
        end_date = ?,
        minimum_purchase_amount = ?,
        minimum_purchase_kg = ?,
        points_per_purchase = ?,
        target_points = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND business_id = ?
      `,
      [
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
        status,
        activeContest.id,
        businessId,
      ]
    );

    const contest = await getActiveContest(businessId);

    res.json({
      ok: true,
      data: mapContest(contest),
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePromotions(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const businessId = req.businessId;
    const promotions = Array.isArray(req.body.promotions)
      ? req.body.promotions.slice(0, 5)
      : [];

    await connection.beginTransaction();

    for (let index = 0; index < 5; index += 1) {
      const promotion = promotions[index] || {};

      const id = promotion.id || null;
      const title = normalizeString(promotion.title, `Promoción ${index + 1}`);
      const description = normalizeString(promotion.description, "");
      const tag = normalizeString(promotion.tag, `Promo ${index + 1}`);
      const active = promotion.active ? 1 : 0;
      const priority = index + 1;

      if (id) {
        await connection.query(
          `
          UPDATE promotions
          SET
            title = ?,
            description = ?,
            tag = ?,
            priority = ?,
            active = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND business_id = ?
          `,
          [title, description, tag, priority, active, id, businessId]
        );
      } else {
        await connection.query(
          `
          INSERT INTO promotions (
            business_id,
            title,
            description,
            tag,
            priority,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
          [businessId, title, description, tag, priority, active]
        );
      }
    }

    await connection.commit();

    const updatedPromotions = await getPromotions(businessId);

    res.json({
      ok: true,
      data: updatedPromotions.map(mapPromotion),
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function updateSocialLinks(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const businessId = req.businessId;
    const socialLinks = Array.isArray(req.body.socialLinks)
      ? req.body.socialLinks.slice(0, 3)
      : [];

    await connection.beginTransaction();

    for (let index = 0; index < 3; index += 1) {
      const social = socialLinks[index] || {};

      const id = social.id || null;
      const name = normalizeString(social.name, `Red social ${index + 1}`);
      const label = normalizeString(social.label, "Escanea");
      const url = normalizeString(social.url, "https://example.com");
      const active = social.active ? 1 : 0;
      const sortOrder = index + 1;

      if (id) {
        await connection.query(
          `
          UPDATE social_links
          SET
            name = ?,
            label = ?,
            url = ?,
            sort_order = ?,
            active = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND business_id = ?
          `,
          [name, label, url, sortOrder, active, id, businessId]
        );
      } else {
        await connection.query(
          `
          INSERT INTO social_links (
            business_id,
            name,
            label,
            url,
            sort_order,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
          [businessId, name, label, url, sortOrder, active]
        );
      }
    }

    await connection.commit();

    const updatedSocialLinks = await getSocialLinks(businessId);

    res.json({
      ok: true,
      data: updatedSocialLinks.map(mapSocialLink),
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function getCustomers(req, res, next) {
  try {
    const businessId = req.businessId;
    const search = normalizeString(req.query.search, "");
    const activeContest = await getActiveContest(businessId);

    const customers = await getCustomerRows(
      businessId,
      search,
      activeContest?.id || null
    );

    res.json({
      ok: true,
      data: customers.map(mapCustomer),
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const businessId = req.businessId;

    const name = normalizeString(req.body.name, "");
    const rut = normalizeString(req.body.rut, "");
    const phone = normalizeNullableString(req.body.phone);
    const email = normalizeNullableString(req.body.email);
    const notes = normalizeNullableString(req.body.notes);
    const active = req.body.active === false ? 0 : 1;

    if (!name || !rut) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y RUT son obligatorios",
        copyright: "© by Mitnick-Connect",
      });
    }

    const [existingRows] = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE business_id = ?
        AND rut = ?
      LIMIT 1
      `,
      [businessId, rut]
    );

    if (existingRows.length) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un cliente con ese RUT",
        copyright: "© by Mitnick-Connect",
      });
    }

    const [insertResult] = await pool.query(
      `
      INSERT INTO customers (
        business_id,
        name,
        rut,
        phone,
        email,
        notes,
        total_points,
        active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [businessId, name, rut, phone, email, notes, active]
    );

    const [rows] = await pool.query(
      `
      SELECT
        id,
        business_id,
        name,
        rut,
        phone,
        email,
        notes,
        total_points,
        active
      FROM customers
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [insertResult.insertId, businessId]
    );

    res.status(201).json({
      ok: true,
      data: mapCustomer({
        ...rows[0],
        current_contest_points: 0,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const businessId = req.businessId;
    const customerId = Number(req.params.id);

    const name = normalizeString(req.body.name, "");
    const rut = normalizeString(req.body.rut, "");
    const phone = normalizeNullableString(req.body.phone);
    const email = normalizeNullableString(req.body.email);
    const notes = normalizeNullableString(req.body.notes);
    const active = req.body.active === false ? 0 : 1;

    if (!customerId) {
      return res.status(400).json({
        ok: false,
        message: "Cliente inválido",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!name || !rut) {
      return res.status(400).json({
        ok: false,
        message: "Nombre y RUT son obligatorios",
        copyright: "© by Mitnick-Connect",
      });
    }

    await pool.query(
      `
      UPDATE customers
      SET
        name = ?,
        rut = ?,
        phone = ?,
        email = ?,
        notes = ?,
        active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND business_id = ?
      `,
      [name, rut, phone, email, notes, active, customerId, businessId]
    );

    const activeContest = await getActiveContest(businessId);

    const customers = await getCustomerRows(
      businessId,
      rut,
      activeContest?.id || null
    );

    res.json({
      ok: true,
      data: customers.length ? mapCustomer(customers[0]) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchases(req, res, next) {
  try {
    const businessId = req.businessId;
    const customerId = req.query.customerId ? Number(req.query.customerId) : null;
    const mode = normalizeString(req.query.mode, "current");
    const activeContest = await getActiveContest(businessId);

    const purchases = await getPurchaseRows({
      businessId,
      contestId: mode === "all" ? null : activeContest?.id || null,
      customerId,
      limit: 150,
    });

    res.json({
      ok: true,
      data: purchases.map(mapPurchase),
    });
  } catch (error) {
    next(error);
  }
}

export async function registerPurchase(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const businessId = req.businessId;

    const activeContest = await getActiveContest(businessId);

    if (!activeContest) {
      return res.status(400).json({
        ok: false,
        message: "No existe un sorteo activo para registrar compras",
        copyright: "© by Mitnick-Connect",
      });
    }

    const customerRut = normalizeString(req.body.customerRut, "");
    const customerName = normalizeString(req.body.customerName, "Cliente sin nombre");
    const customerPhone = normalizeNullableString(req.body.customerPhone);
    const customerEmail = normalizeNullableString(req.body.customerEmail);
    const ticketNumber = normalizeString(req.body.ticketNumber, "");
    const productName = normalizeString(
      req.body.productName,
      activeContest.product_name || "Producto del concurso"
    );
    const totalAmount = toNumber(req.body.totalAmount, 0);
    const totalKg = toNumber(req.body.totalKg, 0);
    const manualPoints = toNumber(
      req.body.manualPoints,
      activeContest.points_per_purchase || 1
    );

    if (!customerRut) {
      return res.status(400).json({
        ok: false,
        message: "El RUT del cliente es obligatorio",
        copyright: "© by Mitnick-Connect",
      });
    }

    if (!ticketNumber) {
      return res.status(400).json({
        ok: false,
        message: "El número de boleta es obligatorio",
        copyright: "© by Mitnick-Connect",
      });
    }

    await connection.beginTransaction();

    const [customerRows] = await connection.query(
      `
      SELECT id, name, total_points
      FROM customers
      WHERE business_id = ?
        AND rut = ?
      LIMIT 1
      `,
      [businessId, customerRut]
    );

    let customerId = null;

    if (customerRows.length) {
      customerId = customerRows[0].id;

      await connection.query(
        `
        UPDATE customers
        SET
          name = CASE WHEN name IS NULL OR name = '' THEN ? ELSE name END,
          phone = COALESCE(phone, ?),
          email = COALESCE(email, ?),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND business_id = ?
        `,
        [customerName, customerPhone, customerEmail, customerId, businessId]
      );
    } else {
      const [customerInsert] = await connection.query(
        `
        INSERT INTO customers (
          business_id,
          name,
          rut,
          phone,
          email,
          total_points,
          active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [businessId, customerName, customerRut, customerPhone, customerEmail]
      );

      customerId = customerInsert.insertId;
    }

    const [duplicateRows] = await connection.query(
      `
      SELECT id
      FROM purchases
      WHERE business_id = ?
        AND ticket_number = ?
      LIMIT 1
      `,
      [businessId, ticketNumber]
    );

    if (duplicateRows.length) {
      await connection.rollback();

      return res.status(409).json({
        ok: false,
        message: "Ya existe una compra registrada con esa boleta",
        copyright: "© by Mitnick-Connect",
      });
    }

    const [purchaseInsert] = await connection.query(
      `
      INSERT INTO purchases (
        business_id,
        contest_id,
        customer_id,
        ticket_number,
        product_name,
        total_amount,
        total_kg,
        points_generated,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        businessId,
        activeContest.id,
        customerId,
        ticketNumber,
        productName,
        totalAmount,
        totalKg,
        manualPoints,
      ]
    );

    await connection.query(
      `
      UPDATE customers
      SET
        total_points = COALESCE(total_points, 0) + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND business_id = ?
      `,
      [manualPoints, customerId, businessId]
    );

    await connection.commit();

    const purchases = await getPurchaseRows({
      businessId,
      contestId: activeContest.id,
      customerId,
      limit: 1,
    });

    res.status(201).json({
      ok: true,
      data: purchases.length
        ? mapPurchase(purchases[0])
        : {
            id: purchaseInsert.insertId,
            businessId,
            contestId: activeContest.id,
            customerId,
            ticketNumber,
            productName,
            totalAmount,
            totalKg,
            pointsGenerated: manualPoints,
          },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}