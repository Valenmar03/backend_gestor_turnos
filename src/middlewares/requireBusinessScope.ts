import type { Request, Response, NextFunction } from "express";

export function requireBusinessScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

  if (req.user.role === "SYS_ADMIN") return next();

  if (!req.user.businessId) {
    return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
  }

  return next();
}
