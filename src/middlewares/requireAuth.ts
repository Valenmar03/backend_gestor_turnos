import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";

type AuthPayload = JwtPayload & {
  userId: string;
  role: "SYS_ADMIN" | "OWNER" | "BADMIN" | "PROFESSIONAL";
  businessId: string | null;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    if (!header) {
      return res.status(401).json({ ok: false, msg: "Falta token (Authorization)" });
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ ok: false, msg: "Formato inválido. Usá: Authorization: Bearer <token>" });
    }

    const secret: Secret | undefined = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, msg: "JWT_SECRET no configurada" });
    }

    const decoded = jwt.verify(token, secret) as AuthPayload;

    // Validación mínima de campos
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      businessId: decoded.businessId ?? null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, msg: "Token inválido o expirado" });
  }
}
