// controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";

export async function login(req: Request, res: Response) {
  const { email, password, businessId } = req.body as {
    email: string;
    password: string;
    businessId: string; // si tu login es multi-business. Si no, lo sacamos.
  };

  const user = await User.findOne({
    businessId,
    email: email.toLowerCase().trim(),
    isActive: true,
  });

  if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({
    sub: user._id.toString(),
    businessId: user.businessId.toString(),
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    },
  });
}
