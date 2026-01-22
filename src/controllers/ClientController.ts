import type { Request, Response } from 'express';
import { Client } from '../models/Client';
import { Business } from '../models/Business';
import { Appointment } from '../models/Appointment';

export class ClientController {
  // GET /api/clients?businessId=xxx
  static async getAllClients(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const filter: any = {};

      if (req.user.role === "SYS_ADMIN") {
        const { businessId } = req.query as { businessId?: string };
        if (businessId) filter.business = businessId;
      } else {
        if (!req.user.businessId) {
          return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
        }
        filter.business = req.user.businessId;
      }

      const clients = await Client.find(filter).sort({ createdAt: -1 });

      return res.json({ ok: true, clients });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener los clientes" });
    }
  }


  // GET /api/clients/:id
  static async getClientById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

      const filter: any = { _id: req.params.id };

      if (req.user.role !== "SYS_ADMIN") {
        if (!req.user.businessId) {
          return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
        }
        filter.business = req.user.businessId;
      }

      const client = await Client.findOne(filter);

      if (!client) {
        return res.status(404).json({ ok: false, msg: "Cliente no encontrado" });
      }

      return res.json({ ok: true, client });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al obtener el cliente" });
    }
  }

  // POST /api/clients
  static async createClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const businessId =
        req.user.role === "SYS_ADMIN"
          ? (req.body.business as string | undefined) ?? null
          : req.user.businessId;

      if (!businessId) {
        return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
      }

      const { name, phone, email, notes } = req.body;

      const client = await Client.create({
        business: businessId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.toLowerCase().trim(),
        notes: notes?.trim(),
        isActive: true,
      });

      return res.status(201).json({ ok: true, msg: "Cliente creado", client });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          ok: false,
          msg: "Ya existe un cliente con ese email en este negocio"
        });
      }
      return res.status(500).json({ ok: false, msg: "Error al crear cliente" });
    }
  }


  // PUT /api/clients/:id
  static async updateClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const businessId =
        req.user.role === "SYS_ADMIN"
          ? (req.body.business as string | undefined) ?? null
          : req.user.businessId;

      if (!businessId) {
        return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
      }

      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name.trim();
      if (req.body.phone) updateData.phone = req.body.phone.trim();
      if (req.body.email) updateData.email = req.body.email?.toLowerCase().trim()
;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes?.trim();

      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, business: businessId, isActive: true },
        updateData,
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ ok: false, msg: "Cliente no encontrado" });
      }

      return res.json({ ok: true, msg: "Cliente actualizado", client });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          ok: false,
          msg: "Ya existe un cliente con ese email en este negocio"
        });
      }
      return res.status(500).json({ ok: false, msg: "Error al actualizar cliente" });
    }
  }


  // DELETE /api/clients/:id
  static async deleteClient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const businessId =
        req.user.role === "SYS_ADMIN"
          ? (req.body.business as string | undefined) ?? null
          : req.user.businessId;

      if (!businessId) {
        return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
      }

      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, business: businessId },
        { isActive: false },
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ ok: false, msg: "Cliente no encontrado" });
      }

      return res.json({ ok: true, msg: "Cliente desactivado", client });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al eliminar cliente" });
    }
  }

}
