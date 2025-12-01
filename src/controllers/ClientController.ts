import type { Request, Response } from 'express';
import { Client } from '../models/Client';
import { Business } from '../models/Business';
import { Appointment } from '../models/Appointment';

export class ClientController {
  // GET /api/clients?businessId=xxx
  static async getAllClients(req: Request, res: Response) {
    try {
      const { businessId } = req.query;

      const filter: any = {};
      if (businessId) {
        filter.business = businessId;
      }

      const clients = await Client.find(filter)
        .sort({ createdAt: -1 });

      return res.json({
        ok: true,
        clients
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener los clientes'
      });
    }
  }

  // GET /api/clients/:id
  static async getClientById(req: Request, res: Response) {
    try {
      const client = await Client.findById(req.params.id);

      if (!client) {
        return res.status(404).json({ ok: false, msg: 'Cliente no encontrado' });
      }

      return res.json({ ok: true, client });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener el cliente'
      });
    }
  }

  // POST /api/clients
  static async createClient(req: Request, res: Response) {
    try {
      const { business, name, email } = req.body;

      if (!business) {
        return res.status(400).json({
          ok: false,
          msg: 'El campo business es obligatorio'
        });
      }

      if (!name) {
        return res.status(400).json({
          ok: false,
          msg: 'El nombre del cliente es obligatorio'
        });
      }

      // opcional: validar que exista el business
      const businessExists = await Business.exists({ _id: business });
      if (!businessExists) {
        return res.status(400).json({
          ok: false,
          msg: 'El negocio asociado no existe'
        });
      }

      // opcional: evitar email repetido dentro del mismo business
      if (email) {
        const existing = await Client.findOne({ business, email });
        if (existing) {
          return res.status(400).json({
            ok: false,
            msg: 'Ya existe un cliente con ese email en este negocio'
          });
        }
      }

      const client = await Client.create(req.body);

      return res.status(201).json({
        ok: true,
        msg: 'Cliente creado correctamente',
        client
      });
    } catch (error: any) {
      console.error(error);

      return res.status(500).json({
        ok: false,
        msg: 'Error al crear el cliente'
      });
    }
  }

  // PUT /api/clients/:id
  static async updateClient(req: Request, res: Response) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return res.status(404).json({
          ok: false,
          msg: 'Cliente no encontrado'
        });
      }

      // no permitimos cambiar de business desde el body
      delete req.body.business;

      // opcional: chequear email duplicado dentro del mismo business
      if (req.body.email) {
        const existing = await Client.findOne({
          business: client.business,
          email: req.body.email,
          _id: { $ne: client._id }
        });

        if (existing) {
          return res.status(400).json({
            ok: false,
            msg: 'Ya existe otro cliente con ese email en este negocio'
          });
        }
      }

      const updated = await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      return res.json({
        ok: true,
        msg: 'Cliente actualizado',
        client: updated
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al actualizar el cliente'
      });
    }
  }

  // DELETE /api/clients/:id
  static async deleteClient(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = await Client.findById(id);
      if (!client) {
        return res.status(404).json({
          ok: false,
          msg: 'Cliente no encontrado'
        });
      }

      // opcional: validar business

      await Appointment.deleteMany({ client: id });
      await client.deleteOne();

      return res.status(200).json({
        ok: true,
        msg: 'Cliente y turnos asociados eliminados correctamente'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al eliminar el cliente'
      });
    }
  }
}
