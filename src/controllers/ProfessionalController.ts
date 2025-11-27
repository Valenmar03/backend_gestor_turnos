import type { Request, Response } from 'express';
import { Professional } from '../models/Professional';
import { Service } from '../models/Service';

export class ProfessionalController {

  // helper interno al controller o en un utils
  private static dedupeIds(ids: any[] = []) {
    const unique = [...new Set(ids.map(id => id.toString()))];
    return unique;
  }


  // GET /api/professionals?businessId=xxx
  static async getAllProfessionals(req: Request, res: Response) {
    try {
      const { businessId } = req.query;

      const filter: any = {};
      if (businessId) {
        filter.business = businessId;
      }

      const professionals = await Professional.find(filter)
        .populate('services')   // opcional: para ver los servicios que hace
        .sort({ createdAt: -1 });

      return res.json({
        ok: true,
        professionals
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener los profesionales'
      });
    }
  }

  // GET /api/professionals/:id
  static async getProfessionalById(req: Request, res: Response) {
    try {
      const professional = await Professional.findById(req.params.id)
        .populate('services');

      if (!professional) {
        return res.status(404).json({ ok: false, msg: 'Profesional no encontrado' });
      }

      return res.json({ ok: true, professional });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener el profesional'
      });
    }
  }

  // POST /api/professionals
  static async createProfessional(req: Request, res: Response) {
    try {
      const { business, services } = req.body;

      if (!business) {
        return res.status(400).json({
          ok: false,
          msg: 'El campo business es obligatorio'
        });
      }

      if (services && services.length > 0) {
        req.body.services = ProfessionalController.dedupeIds(services);

        const validServices = await Service.find({
          _id: { $in: req.body.services },
          business
        }).select('_id');

        if (validServices.length !== req.body.services.length) {
          return res.status(400).json({
            ok: false,
            msg: 'Hay servicios que no pertenecen a este negocio'
          });
        }
      }

      const professional = await Professional.create(req.body);

      return res.status(201).json({
        ok: true,
        msg: 'Profesional creado correctamente',
        professional
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al crear el profesional'
      });
    }
  }


  // PUT /api/professionals/:id
  static async updateProfessional(req: Request, res: Response) {
    try {
      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({ ok: false, msg: 'Profesional no encontrado' });
      }

      const businessId = professional.business;

      if (req.body.services && req.body.services.length > 0) {
        req.body.services = ProfessionalController.dedupeIds(req.body.services);

        const validServices = await Service.find({
          _id: { $in: req.body.services },
          business: businessId
        }).select('_id');

        if (validServices.length !== req.body.services.length) {
          return res.status(400).json({
            ok: false,
            msg: 'Hay servicios que no pertenecen al negocio del profesional'
          });
        }
      }

      delete req.body.business;

      const updated = await Professional.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).populate('services');

      return res.json({
        ok: true,
        msg: 'Profesional actualizado',
        professional: updated
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al actualizar el profesional'
      });
    }
  }


  // DELETE /api/professionals/:id
  static async deleteProfessional(req: Request, res: Response) {
    try {
      const professional = await Professional.findByIdAndDelete(req.params.id);

      if (!professional) {
        return res.status(404).json({ ok: false, msg: 'Profesional no encontrado' });
      }

      return res.json({
        ok: true,
        msg: 'Profesional eliminado'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al eliminar el profesional'
      });
    }
  }

  // POST /api/professionals/:id/timeoff  (para cargar vacaciones/licencias)
  static async addTimeOff(req: Request, res: Response) {
    try {
      const { start, end, reason } = req.body;

      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({ ok: false, msg: 'Profesional no encontrado' });
      }

      professional.timeOff.push({ start, end, reason });
      await professional.save();

      return res.json({
        ok: true,
        msg: 'Licencia / vacaciones agregadas',
        professional
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al agregar licencia'
      });
    }
  }

  // POST /api/professionals/:id/add-service
  static async addService(req: Request, res: Response) {
    try {
      const { serviceId } = req.body;

      if (!serviceId) {
        return res.status(400).json({
          ok: false,
          msg: 'Debe enviar serviceId en el body'
        });
      }

      const professional = await Professional.findById(req.params.id);
      if (!professional) {
        return res.status(404).json({
          ok: false,
          msg: 'Profesional no encontrado'
        });
      }

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          ok: false,
          msg: 'Servicio no encontrado'
        });
      }

      // ✅ Validar que el service pertenezca al mismo business que el professional
      if (service.business.toString() !== professional.business.toString()) {
        return res.status(400).json({
          ok: false,
          msg: 'El servicio no pertenece al mismo negocio que el profesional'
        });
      }

      // ✅ Evitar duplicado
      const alreadyHas = professional.services.some(
        s => s.toString() === serviceId
      );

      if (alreadyHas) {
        return res.status(400).json({
          ok: false,
          msg: 'El profesional ya tiene asignado este servicio'
        });
      }

      professional.services.push(service._id);
      await professional.save();

      return res.json({
        ok: true,
        msg: 'Servicio agregado al profesional',
        professional
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        msg: 'Error al agregar el servicio al profesional'
      });
    }
  }
}
