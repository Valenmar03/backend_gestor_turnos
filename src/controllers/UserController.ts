import type { Request, Response } from "express";
import crypto from "crypto";
import { User, hashPassword, USER_ROLES, type UserRole } from "../models/User";

function generateTempPassword(length = 10) {
  return crypto.randomBytes(16).toString("hex").slice(0, length);
}

export class UserController {
  static async createUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const creatorRole = req.user.role;

      const {
        name,
        email,
        role,
        businessId: businessIdFromBody,
        password,
        isBookable,
      } = req.body as {
        name?: string;
        email?: string;
        role?: UserRole;
        businessId?: string;
        password?: string;
        isBookable?: boolean;
      };

      if (!name || !email || !role) {
        return res.status(400).json({ ok: false, msg: "name, email y role son requeridos" });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ ok: false, msg: "Rol inválido" });
      }

      // ===== Reglas de creación por rol del creador =====

      // OWNER: solo puede crear BADMIN/PROFESSIONAL y solo dentro de su negocio
      let finalBusinessId: string | null = null;

      if (creatorRole === "OWNER") {
        if (role === "SYS_ADMIN" || role === "OWNER") {
          return res.status(403).json({ ok: false, msg: "OWNER no puede crear SYS_ADMIN u OWNER" });
        }

        if (!req.user.businessId) {
          return res.status(403).json({ ok: false, msg: "Tu usuario no tiene negocio asignado" });
        }

        finalBusinessId = req.user.businessId; // ignora lo que manden
      }

      // SYS_ADMIN: puede crear para cualquier negocio, pero:
      if (creatorRole === "SYS_ADMIN") {
        // SYS_ADMIN puede crear SYS_ADMIN sin businessId
        if (role === "SYS_ADMIN") {
          finalBusinessId = null;
        } else {
          if (!businessIdFromBody) {
            return res.status(400).json({ ok: false, msg: "businessId es requerido para ese rol" });
          }
          finalBusinessId = businessIdFromBody;
        }
      }

      if (creatorRole !== "SYS_ADMIN" && creatorRole !== "OWNER") {
        return res.status(403).json({ ok: false, msg: "Sin permisos para crear usuarios" });
      }

      const plainPassword = password?.trim() || generateTempPassword();
      const passwordHash = await hashPassword(plainPassword);

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        businessId: finalBusinessId ?? undefined,
        passwordHash,
        isBookable: typeof isBookable === "boolean" ? isBookable : true,
        isActive: true,
      });

      return res.status(201).json({
        ok: true,
        msg: "Usuario creado",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessId: user.businessId ?? null,
          isActive: user.isActive,
          isBookable: user.isBookable,
        },
        tempPassword: password ? undefined : plainPassword,
      });
    } catch (error: any) {
      // Email duplicado (Mongo)
      if (error?.code === 11000) {
        return res.status(409).json({ ok: false, msg: "Ya existe un usuario con ese email" });
      }
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al crear usuario" });
    }
  }

  // GET /api/users (lista usuarios del negocio; SYS_ADMIN puede filtrar)
  static async getUsers(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const requester = req.user;

      if (requester.role === "OWNER") {
        const users = await User.find({ businessId: requester.businessId }).sort({ createdAt: -1 });
        return res.json({ ok: true, users });
      }

      if (requester.role === "SYS_ADMIN") {
        const businessId = req.query.businessId as string | undefined;
        const filter = businessId ? { businessId } : {};
        const users = await User.find(filter).sort({ createdAt: -1 });
        return res.json({ ok: true, users });
      }

      return res.status(403).json({ ok: false, msg: "Sin permisos" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener usuarios" });
    }
  }
}
