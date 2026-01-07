// utils/jwt.ts
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type JwtPayload = { sub: string; businessId: string; role: string };

function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Falta JWT_SECRET en el .env");
  return s;
}

function getExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getExpiresIn() });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
