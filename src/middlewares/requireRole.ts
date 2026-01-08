import type { Request, Response, NextFunction } from "express";

type Role = "SYS_ADMIN" | "OWNER" | "BADMIN" | "PROFESSIONAL";

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, msg: "No autenticado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, msg: "Sin permisos" });
    }

    next();
  };
}
