import type { Request, Response, NextFunction } from "express";

export function requireBusinessScope(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ ok: false, msg: "No autenticado" });
  }

  if (req.user.role === "SYS_ADMIN") {
    return next();
  }

  const businessIdFromToken = req.user.businessId; // string | null

  if (!businessIdFromToken) {
    return res.status(403).json({
      ok: false,
      msg: "Usuario sin negocio asignado",
    });
  }

  if (!req.params.id) {
    return next();
  }

  const businessIdFromParams = req.params.id;

  if (businessIdFromToken !== businessIdFromParams) {
    return res.status(403).json({
      ok: false,
      msg: "Acceso fuera de tu negocio",
      businessIdFromToken,
      businessIdFromParams,
    });
  }

  return next();
}
