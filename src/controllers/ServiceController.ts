import type { Request, Response } from 'express';
import { Service } from '../models/Service';
import { Appointment } from '../models/Appointment';
import { Professional } from '../models/Professional';
import { Business } from '../models/Business';

export class ServiceController {

  // GET /api/services?businessId=xxx
  static async getAllServices(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const creatorRole = req.user.role;

      let businessId: string | null = null;

      if (creatorRole === "SYS_ADMIN") {
        businessId = (req.query.businessId as string) ?? null;
      } else {
        businessId = req.user.businessId;
      }

      const filter: any = {};
      if (businessId) filter.business = businessId;

      const services = await Service.find(filter).sort({ createdAt: -1 });

      return res.json({ ok: true, services });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener los servicios" });
    }
  }


  // GET /api/services/:id
  static async getServiceById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const filter: any = { _id: req.params.id };

      if (req.user.role !== "SYS_ADMIN") {
        filter.business = req.user.businessId;
      }

      const service = await Service.findOne(filter);

      if (!service) {
        return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
      }

      return res.json({ ok: true, service });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener el servicio" });
    }
  }


  // POST /api/services
  static async createService(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const {
        name,
        description,
        durationMinutes,
        price,
        category,
        color,
        allowOverlap,
        maxConcurrentAppointments,
        business: businessFromBody, // solo sysadmin
      } = req.body;

      let businessId: string | null;

      if (req.user.role === "SYS_ADMIN") {
        businessId = businessFromBody ?? null;
        if (!businessId) {
          return res.status(400).json({ ok: false, msg: "business es obligatorio para SYS_ADMIN" });
        }
      } else {
        businessId = req.user.businessId; // por middleware existe
      }

      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({ ok: false, msg: "Negocio no encontrado" });
      }

      const service = await Service.create({
        business: businessId,
        name,
        description,
        durationMinutes,
        price,
        category,
        color,
        allowOverlap: typeof allowOverlap === "boolean" ? allowOverlap : false,
        maxConcurrentAppointments: maxConcurrentAppointments ?? 1,
        isActive: true,
      });

      return res.status(201).json({ ok: true, msg: "Servicio creado correctamente", service });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al crear el servicio" });
    }
  }


  // PUT /api/services/:id
  static async updateService(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const filter: any = { _id: req.params.id };
      if (req.user.role !== "SYS_ADMIN") {
        filter.business = req.user.businessId;
      }

      // evitar que te cambien el business por body
      const { business, ...safeBody } = req.body;

      const service = await Service.findOneAndUpdate(filter, safeBody, { new: true });

      if (!service) {
        return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
      }

      return res.json({ ok: true, msg: "Servicio actualizado", service });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al actualizar el servicio" });
    }
  }


  // DELETE /api/services/:id
  static async deleteService(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const filter: any = { _id: req.params.id };
      if (req.user.role !== "SYS_ADMIN") {
        filter.business = req.user.businessId;
      }

      const service = await Service.findOneAndUpdate(
        filter,
        { isActive: false },
        { new: true }
      );

      if (!service) {
        return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
      }

      await Professional.updateMany(
        { business: service.business, services: service._id },
        { $pull: { services: service._id } }
      );

      return res.json({
        ok: true,
        msg: "Servicio desactivado",
        service,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al desactivar el servicio" });
    }
  }


}
