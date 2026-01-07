import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "No autorizado" });
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Sin permisos" });
    }
    next();
  };
}