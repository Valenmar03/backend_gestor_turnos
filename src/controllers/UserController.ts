import type { Request, Response } from "express";
import crypto from "crypto";
import { User, hashPassword, USER_ROLES, type UserRole } from "../models/User";
import { Business } from "../models/Business";
import { Appointment } from "../models/Appointment";
import { Professional } from "../models/Professional";

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
        phone,
      } = req.body as {
        name?: string;
        email?: string;
        role?: UserRole;
        businessId?: string;
        password?: string;
        isBookable?: boolean;
        phone?: string;
      };

      if (!name || !email || !role || !phone) {
        return res
          .status(400)
          .json({ ok: false, msg: "nombre, email, rol y teléfono son requeridos" });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ ok: false, msg: "Rol inválido" });
      }

      const ROLE_REQUIRES_BUSINESS: UserRole[] = ["OWNER", "BADMIN", "PROFESSIONAL"];

      let finalBusinessId: string | null = null;

      if (creatorRole === "OWNER") {
        if (role === "SYS_ADMIN" || role === "OWNER") {
          return res
            .status(403)
            .json({ ok: false, msg: "OWNER no puede crear SYS_ADMIN u OWNER" });
        }

        if (!req.user.businessId) {
          return res
            .status(403)
            .json({ ok: false, msg: "Tu usuario no tiene negocio asignado" });
        }

        finalBusinessId = req.user.businessId;
      } else if (creatorRole === "SYS_ADMIN") {
        if (role === "SYS_ADMIN") {
          finalBusinessId = null;
        } else {
          if (!businessIdFromBody) {
            return res
              .status(400)
              .json({ ok: false, msg: "businessId es requerido para ese rol" });
          }
          finalBusinessId = businessIdFromBody;
        }
      } else {
        return res
          .status(403)
          .json({ ok: false, msg: "Sin permisos para crear usuarios" });
      }

      if (ROLE_REQUIRES_BUSINESS.includes(role) && !finalBusinessId) {
        return res.status(400).json({
          ok: false,
          msg: `El rol requiere un negocio (businessId)`,
        });
      }

      if (finalBusinessId) {
        const businessExists = await Business.exists({ _id: finalBusinessId });
        if (!businessExists) {
          return res.status(404).json({
            ok: false,
            msg: "No existe el negocio",
          });
        }
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
        phone: phone.trim(),
      });

      // Si en algún momento permitís que se cree OWNER por SYS_ADMIN, esto queda OK.
      if (role === "OWNER" && finalBusinessId) {
        const updatedBusiness = await Business.findByIdAndUpdate(
          finalBusinessId,
          { ownerUserId: user._id },
          { new: true }
        );

        if (!updatedBusiness) {
          return res.status(404).json({
            ok: false,
            msg: "Usuario creado, pero no se encontró el negocio para asignarle owner",
          });
        }
      }

      if ((role === "BADMIN" || role === "PROFESSIONAL") && finalBusinessId) {
        await Professional.updateOne(
          { userId: user._id },
          {
            $setOnInsert: {
              business: finalBusinessId,
              userId: user._id,
              services: [],
              workingHours: [],
              timeOff: [],
              isActive: true,
              allowOverlap: false,
            },
          },
          { upsert: true }
        );
      }

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
          phone: user.phone,
        },
        tempPassword: password ? undefined : plainPassword,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        console.error(error);
        return res
          .status(409)
          .json({ ok: false, msg: "Ya existe un usuario con ese email" });
      }
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

  static async setUserStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const requester = req.user;
      const targetUserId = req.params.id;
      const { isActive } = req.body as { isActive?: boolean };

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ ok: false, msg: "isActive es requerido" });
      }

      const target = await User.findById(targetUserId);
      if (!target) {
        return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
      }

      // No permitir tocar SYS_ADMIN (salvo SYS_ADMIN, si querés, pero yo recomiendo bloquear igual)
      if (target.role === "SYS_ADMIN") {
        return res.status(403).json({ ok: false, msg: "No se puede modificar un SYS_ADMIN" });
      }

      if (requester.userId === target._id.toString()) {
        return res.status(403).json({ ok: false, msg: "No podés modificar tu propio estado" });
      }

      if (requester.role === "OWNER") {
        if (!requester.businessId) {
          return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
        }
        if (!target.businessId || target.businessId.toString() !== requester.businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }

        // Opcional: owner no puede desactivar a otro OWNER
        if (target.role === "OWNER") {
          return res.status(403).json({ ok: false, msg: "No podés modificar el estado de otro OWNER" });
        }
      }

      if (isActive === false) {
        const now = new Date();

        const activeStatuses = ["PENDING", "CONFIRMED"]; // ajustalo a tus estados reales

        const count = await Appointment.countDocuments({
          professionalId: target._id,
          status: { $in: activeStatuses },
          startAt: { $gte: now }, // o el campo que uses
        });

        if (count > 0) {
          return res.status(409).json({
            ok: false,
            msg: `No se puede desactivar: tiene ${count} turno(s) activo(s) o futuro(s). Reasigná/cancelá antes.`,
          });
        }
      }

      target.isActive = isActive;
      await target.save();

      return res.json({
        ok: true,
        msg: isActive ? "Usuario activado" : "Usuario desactivado",
        user: {
          id: target._id,
          name: target.name,
          email: target.email,
          role: target.role,
          businessId: target.businessId ?? null,
          isActive: target.isActive,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al actualizar estado del usuario" });
    }
  }

  static async setUserRole(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const requester = req.user;
      const targetUserId = req.params.id;
      const { role } = req.body as { role?: UserRole };

      if (!role) {
        return res.status(400).json({ ok: false, msg: "role es requerido" });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ ok: false, msg: "Rol inválido" });
      }

      const target = await User.findById(targetUserId);
      if (!target) {
        return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
      }


      if (requester.userId === target._id.toString()) {
        return res.status(403).json({ ok: false, msg: "No podés cambiar tu propio rol" });
      }


      if (target.role === "SYS_ADMIN") {
        return res.status(403).json({ ok: false, msg: "No se puede modificar un SYS_ADMIN" });
      }

      if (requester.role === "OWNER") {
        if (!requester.businessId) {
          return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
        }

        if (!target.businessId || target.businessId.toString() !== requester.businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }

        const allowedForOwner: UserRole[] = ["BADMIN", "PROFESSIONAL"];
        if (!allowedForOwner.includes(role)) {
          return res.status(403).json({ ok: false, msg: "OWNER solo puede asignar BADMIN o PROFESSIONAL" });
        }

        if (target.role === "OWNER") {
          return res.status(403).json({ ok: false, msg: "No podés cambiar el rol de un OWNER" });
        }
      }

      target.role = role;
      await target.save();

      return res.json({
        ok: true,
        msg: "Rol actualizado",
        user: {
          id: target._id,
          name: target.name,
          email: target.email,
          role: target.role,
          businessId: target.businessId ?? null,
          isActive: target.isActive,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al actualizar rol" });
    }
  }
}

