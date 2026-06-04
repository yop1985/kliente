import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "kliente_mitnick_connect_super_secret_2026";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        message: "Token no enviado",
        copyright: "© by Mitnick-Connect",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Token no enviado",
        copyright: "© by Mitnick-Connect",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: payload.id,
      businessId: payload.businessId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Token inválido o expirado",
      copyright: "© by Mitnick-Connect",
    });
  }
}