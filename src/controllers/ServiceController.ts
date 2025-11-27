import type { Request, Response } from 'express';
import { Service } from '../models/Service';

export class ServiceController {

  // GET /api/services?businessId=xxx
  static async getAllServices(req: Request, res: Response) {
    try {
      const { businessId } = req.query;

      const filter: any = {};
      if (businessId) {
        filter.business = businessId;
      }

      const services = await Service.find(filter)
        .sort({ createdAt: -1 });

      return res.json({
        ok: true,
        services
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener los servicios'
      });
    }
  }

  // GET /api/services/:id
  static async getServiceById(req: Request, res: Response) {
    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({ ok: false, msg: 'Servicio no encontrado' });
      }

      return res.json({ ok: true, service });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener el servicio'
      });
    }
  }

  // POST /api/services
  static async createService(req: Request, res: Response) {
    try {
      const service = await Service.create(req.body);

      return res.status(201).json({
        ok: true,
        msg: 'Servicio creado correctamente',
        service
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al crear el servicio'
      });
    }
  }

  // PUT /api/services/:id
  static async updateService(req: Request, res: Response) {
    try {
      const service = await Service.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!service) {
        return res.status(404).json({ ok: false, msg: 'Servicio no encontrado' });
      }

      return res.json({
        ok: true,
        msg: 'Servicio actualizado',
        service
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al actualizar el servicio'
      });
    }
  }

  // DELETE /api/services/:id
  static async deleteService(req: Request, res: Response) {
    try {
      const service = await Service.findByIdAndDelete(req.params.id);

      if (!service) {
        return res.status(404).json({ ok: false, msg: 'Servicio no encontrado' });
      }

      return res.json({
        ok: true,
        msg: 'Servicio eliminado'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al eliminar el servicio'
      });
    }
  }
}
