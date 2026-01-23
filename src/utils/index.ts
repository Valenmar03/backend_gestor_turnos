import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateTempPassword(length = 10) {
  return crypto.randomBytes(16).toString("hex").slice(0, length);
}

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}
