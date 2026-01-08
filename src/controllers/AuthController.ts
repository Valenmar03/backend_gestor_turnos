import type { Request, Response } from "express";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { User } from "../models/User";

function signToken(payload: object) {
  const secret: Secret | undefined = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no configurada");

  const expiresIn: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN ??
    "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn });
}

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res
          .status(400)
          .json({ ok: false, msg: "Email y password son requeridos" });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.isActive) {
        return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = signToken({
        userId: user._id,
        role: user.role,
        businessId: user.businessId ?? null,
      });

      return res.json({
        ok: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessId: user.businessId ?? null,
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ ok: false, msg: "Error al iniciar sesión" });
    }
  }
}
