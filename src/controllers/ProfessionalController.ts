import type { Request, Response } from "express";
import { Professional } from "../models/Professional";
import { Service } from "../models/Service";
import { Business } from "../models/Business";
import { User } from "../models/User";
import { generateTempPassword, hashPassword } from "../utils";
import { Types } from "mongoose";


export class ProfessionalController {
  private static dedupeIds(ids: any[] = []) {
    return [...new Set(ids.map((id) => id.toString()))];
  }

  static async getAllProfessionals(req: Request, res: Response) {
    try {
      if (!req.user?.businessId && req.user?.role !== "SYS_ADMIN") {
        return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
      }

      const businessId = req.user.role === "SYS_ADMIN"
        ? (req.query.businessId as string | undefined)
        : req.user.businessId;

      if (!businessId) {
        return res.status(400).json({ ok: false, msg: "businessId es requerido para SYS_ADMIN" });
      }

      const professionals = await Professional.find({ business: businessId })
        .populate("services")
        .populate("userId", "name email isActive role phone")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ ok: true, professionals });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener los profesionales" });
    }
  }

  //GET /api/professionals/:id
  static async getProfessionalById(req: Request, res: Response) {
    try {
      const professional = await Professional.findById(req.params.id)
        .populate("services")
        .populate("userId", "name email isActive role phone")
        .lean();

      if (!professional) {
        return res.status(404).json({ ok: false, msg: "Profesional no encontrado" });
      }

      // scope: si no es SYS_ADMIN, debe ser del mismo negocio
      if (req.user?.role !== "SYS_ADMIN") {
        const businessId = req.user?.businessId;
        if (!businessId || professional.business.toString() !== businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }
      }

      return res.json({ ok: true, professional });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener el profesional" });
    }
  }

  // POST /api/professionals
  static async createProfessional(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const creatorRole = req.user.role;

      if (creatorRole !== "OWNER" && creatorRole !== "SYS_ADMIN") {
        return res.status(403).json({ ok: false, msg: "Sin permisos para crear profesionales" });
      }

      const {
        name,
        email,
        phone,
        services = [],
        color,
        workingHours = [],
        timeOff = [],
        allowOverlap = false,
        password, // opcional: si no viene => temp
        businessId: businessIdFromBody, // solo SYS_ADMIN
      } = req.body as {
        name?: string;
        email?: string;
        phone?: string;
        services?: string[];
        color?: string;
        workingHours?: any[];
        timeOff?: any[];
        allowOverlap?: boolean;
        password?: string;
        businessId?: string;
      };

      if (!name || !email || !phone) {
        return res.status(400).json({ ok: false, msg: "name, email y phone son requeridos" });
      }


      let finalBusinessId: string | null = null;

      if (creatorRole === "OWNER") {
        if (!req.user.businessId) {
          return res.status(403).json({ ok: false, msg: "Tu usuario no tiene negocio asignado" });
        }
        finalBusinessId = req.user.businessId;
      } else {
        // SYS_ADMIN
        if (!businessIdFromBody) {
          return res.status(400).json({ ok: false, msg: "businessId es requerido para SYS_ADMIN" });
        }
        finalBusinessId = businessIdFromBody;
      }

      const businessExists = await Business.exists({ _id: finalBusinessId });
      if (!businessExists) return res.status(404).json({ ok: false, msg: "No existe el negocio" });

      // 2) validar services contra business (mismo criterio que en updateProfessional)
      let cleanServices: string[] = [];
      if (Array.isArray(services) && services.length > 0) {
        cleanServices = ProfessionalController.dedupeIds(services);

        const validServices = await Service.find({
          _id: { $in: cleanServices },
          business: finalBusinessId,
        }).select("_id");

        if (validServices.length !== cleanServices.length) {
          return res.status(400).json({ ok: false, msg: "Hay servicios que no pertenecen al negocio" });
        }
      }

      // 3) crear User PROFESSIONAL
      const plainPassword = password?.trim() || generateTempPassword();
      const passwordHash = await hashPassword(plainPassword);

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: "PROFESSIONAL",
        business: finalBusinessId, 
        passwordHash,
        isActive: true,
        phone: phone.trim(),
      });

      const businessObjId = new Types.ObjectId(finalBusinessId);
      const servicesObjIds = cleanServices.map(id => new Types.ObjectId(id));


      try {
        const professional = await Professional.create({
          business: businessObjId,
          userId: user._id,
          services: servicesObjIds,
          color,
          workingHours,
          timeOff,
          allowOverlap,
        });

        const populated = await Professional.findById(professional._id)
          .populate("services")
          .populate("userId", "name email isActive role phone")
          .lean();

        return res.status(201).json({
          ok: true,
          msg: "Profesional creado",
          professional: populated,
          tempPassword: password ? undefined : plainPassword,
        });
      } catch (err) {
        // rollback manual del user si falla professional
        await User.deleteOne({ _id: user._id });
        throw err;
      }
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({ ok: false, msg: "Ya existe un usuario con ese email" });
      }
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al crear profesional" });
    }
  }


  static async updateProfessional(req: Request, res: Response) {
    try {
      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({ ok: false, msg: "Profesional no encontrado" });
      }

      if (req.user?.role !== "SYS_ADMIN") {
        const businessId = req.user?.businessId;
        if (!businessId || professional.business.toString() !== businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }
      }

      const businessId = professional.business.toString();

      if (req.body.services && req.body.services.length > 0) {
        req.body.services = ProfessionalController.dedupeIds(req.body.services);

        const validServices = await Service.find({
          _id: { $in: req.body.services },
          business: businessId,
        }).select("_id");

        if (validServices.length !== req.body.services.length) {
          return res.status(400).json({
            ok: false,
            msg: "Hay servicios que no pertenecen al negocio del profesional",
          });
        }
      }

      delete req.body.business;
      delete req.body.userId;
      delete req.body.name;
      delete req.body.email;
      delete req.body.phone;
      delete req.body.isActive;

      const updated = await Professional.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate("services")
        .populate("userId", "name email isActive role isBookable");

      return res.json({ ok: true, msg: "Perfil profesional actualizado", professional: updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al actualizar el profesional" });
    }
  }

  static async addTimeOff(req: Request, res: Response) {
    try {
      const { start, end, reason } = req.body;

      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({ ok: false, msg: "Profesional no encontrado" });
      }

      if (req.user?.role !== "SYS_ADMIN") {
        const businessId = req.user?.businessId;
        if (!businessId || professional.business.toString() !== businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }
      }

      professional.timeOff.push({ start, end, reason });
      await professional.save();

      const populated = await Professional.findById(professional._id)
        .populate("services")
        .populate("userId", "name email isActive role isBookable");

      return res.json({ ok: true, msg: "Licencia / vacaciones agregadas", professional: populated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al agregar licencia" });
    }
  }

  static async addService(req: Request, res: Response) {
    try {
      const { serviceId } = req.body;

      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({ ok: false, msg: "Profesional no encontrado" });
      }

      if (req.user?.role !== "SYS_ADMIN") {
        const businessId = req.user?.businessId;
        if (!businessId || professional.business.toString() !== businessId) {
          return res.status(403).json({ ok: false, msg: "Acceso fuera de tu negocio" });
        }
      }

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
      }

      if (service.business.toString() !== professional.business.toString()) {
        return res.status(400).json({ ok: false, msg: "El servicio no pertenece al mismo negocio" });
      }

      const alreadyHas = professional.services.some((s) => s.toString() === serviceId);
      if (alreadyHas) {
        return res.status(400).json({ ok: false, msg: "El profesional ya tiene asignado este servicio" });
      }

      professional.services.push(service._id);
      await professional.save();

      const populated = await Professional.findById(professional._id)
        .populate("services")
        .populate("userId", "name email isActive role isBookable");

      return res.json({ ok: true, msg: "Servicio agregado", professional: populated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al agregar el servicio" });
    }
  }
}
