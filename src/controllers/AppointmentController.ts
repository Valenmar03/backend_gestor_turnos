import type { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { Service } from "../models/Service";
import { Professional } from "../models/Professional";
import { Client } from "../models/Client";


export class AppointmentController {
    private static timeStringToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
    }

   private static applyTime(baseDate: Date, time: string): Date {
      const [h, m] = time.split(':').map(Number);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
   }

   private static rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
      return aStart < bEnd && aEnd > bStart;
   }

    private static isWithinWorkingHours(
    professional: any,
    start: Date,
    end: Date
    ): boolean {
    const dayOfWeek = start.getDay();

    if (start.toDateString() !== end.toDateString()) {
        return false;
    }

    const daySchedule = professional.workingHours?.filter(
        (wh: any) => wh.dayOfWeek === dayOfWeek
    );

    if (!daySchedule || daySchedule.length === 0) {
        return false;
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    return daySchedule.some((wh: any) => {
        const whStart = this.timeStringToMinutes(wh.startTime);
        const whEnd = this.timeStringToMinutes(wh.endTime);
        return startMinutes >= whStart && endMinutes <= whEnd;
    });
    }

    private static isInTimeOff(
    professional: any,
    start: Date,
    end: Date
    ): boolean {
    const timeOff = professional.timeOff || [];

    return timeOff.some((to: any) => {
        const offStart = new Date(to.start);
        const offEnd = new Date(to.end);
        // Solapado de intervalos
        return offStart < end && offEnd > start;
    });
    }


   private static async exceedsOverlapLimit(params: {
      professionalId: string;
      serviceId: string;
      start: Date;
      end: Date;
      allowOverlapProfessional: boolean;
      allowOverlapService: boolean;
      maxConcurrentAppointments: number;
      excludeId?: string;
   }) {
      const {
         professionalId,
         serviceId,
         start,
         end,
         allowOverlapProfessional,
         allowOverlapService,
         maxConcurrentAppointments,
         excludeId,
      } = params;

      if (
         !allowOverlapProfessional ||
         !allowOverlapService ||
         maxConcurrentAppointments <= 1
      ) {
         const filter: any = {
            professional: professionalId,
            status: { $ne: "cancelled" },
            start: { $lt: end },
            end: { $gt: start },
         };

         if (excludeId) {
            filter._id = { $ne: excludeId };
         }

         const existing = await Appointment.findOne(filter);
         return !!existing;
      }

      const filter: any = {
         professional: professionalId,
         service: serviceId,
         status: { $ne: "cancelled" },
         start: { $lt: end },
         end: { $gt: start },
      };

      if (excludeId) {
         filter._id = { $ne: excludeId };
      }

      const count = await Appointment.countDocuments(filter);

      return count >= maxConcurrentAppointments;
   }

   // GET /api/appointments?businessId=xxx&professionalId=yyy&from=2025-01-01&to=2025-01-31
   static async getAllAppointments(req: Request, res: Response) {
      try {
         const { businessId, professionalId, from, to } = req.query;

         const filter: any = {};
         if (businessId) filter.business = businessId;
         if (professionalId) filter.professional = professionalId;

         if (from || to) {
            filter.start = {};
            if (from) filter.start.$gte = new Date(from as string);
            if (to) filter.start.$lte = new Date(to as string);
         }

         const appointments = await Appointment.find(filter)
            .populate("service")
            .populate("professional")
            .populate("client")
            .sort({ start: 1 });

         return res.json({
            ok: true,
            appointments,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al obtener los turnos",
         });
      }
   }

   // GET /api/appointments/:id
   static async getAppointmentById(req: Request, res: Response) {
      try {
         const appointment = await Appointment.findById(req.params.id)
            .populate("service")
            .populate("professional")
            .populate("client");

         if (!appointment) {
            return res.status(404).json({
               ok: false,
               msg: "Turno no encontrado",
            });
         }

         return res.json({ ok: true, appointment });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al obtener el turno",
         });
      }
   }

   // POST /api/appointments
   static async createAppointment(req: Request, res: Response) {
      try {
         const {
            service: serviceId,
            professional: professionalId,
            client: clientId,
            start,
            end,
            notes,
            status,
            source
         } = req.body;

         if (!serviceId || !professionalId || !clientId || !start) {
            return res.status(400).json({
               ok: false,
               msg: 'Faltan datos obligatorios (service, professional, client, start)'
            });
         }

         const startDate = new Date(start);
            if (isNaN(startDate.getTime())) {
            return res.status(400).json({
               ok: false,
               msg: 'La fecha de inicio (start) no es válida'
            });
         }

         // 1) Traemos service y professional
         const [service, professional] = await Promise.all([
            Service.findById(serviceId),
            Professional.findById(professionalId)
         ]);

         if (!service) {
            return res.status(404).json({
               ok: false,
               msg: 'Servicio no encontrado'
            });
         }

         if (!professional) {
            return res.status(404).json({
               ok: false,
               msg: 'Profesional no encontrado'
            });
         }

         if (!professional.isActive) {
            return res.status(400).json({
               ok: false,
               msg: 'El profesional no está activo'
            });
         }

         // 2) Calculamos end si no viene desde el front
         let endDate: Date;
         if (end) {
            endDate = new Date(end);
         } else {
            const duration = service.durationMinutes || 60;
            endDate = new Date(startDate.getTime() + duration * 60 * 1000);
         }

         if (isNaN(endDate.getTime())) {
            return res.status(400).json({
               ok: false,
               msg: 'La fecha de fin (end) no es válida'
            });
         }

         if (endDate <= startDate) {
            return res.status(400).json({
               ok: false,
               msg: 'La fecha de fin debe ser posterior a la de inicio'
            });
         }

         const dayOfWeek = startDate.getDay(); // 0 = domingo ... 6 = sábado
         const dayWorkingHours = professional.workingHours?.filter(
            (wh: any) => wh.dayOfWeek === dayOfWeek
         ) || [];

         if (!dayWorkingHours.length) {
            return res.status(400).json({
               ok: false,
               msg: 'El profesional no tiene horario configurado para ese día'
            });
         }

         // Verificamos que [startDate, endDate) esté completamente dentro de algún rango definido
         const isInsideWorkingHours = dayWorkingHours.some((wh: any) => {
            const whStart = AppointmentController.applyTime(startDate, wh.startTime);
            const whEnd = AppointmentController.applyTime(startDate, wh.endTime);
            return startDate >= whStart && endDate <= whEnd;
         });

         if (!isInsideWorkingHours) {
            return res.status(400).json({
               ok: false,
               msg: 'El turno está fuera del horario laboral del profesional'
            });
         }

         const hasTimeOffConflict = (professional.timeOff || []).some((to: any) =>
            AppointmentController.rangesOverlap(startDate, endDate, to.start, to.end)
         );

         if (hasTimeOffConflict) {
            return res.status(400).json({
               ok: false,
               msg: 'El turno cae dentro de un bloqueo / vacaciones del profesional'
            });
         }

         const overlappingAppointments = await Appointment.find({
            professional: professionalId,
            start: { $lt: endDate },
            end: { $gt: startDate }
         });

         if (overlappingAppointments.length > 0) {
         
            if (!professional.allowOverlap) {
               return res.status(400).json({
                  ok: false,
                  msg: 'El profesional no permite solapamiento de turnos'
               });
            }

            if (!service.allowOverlap) {
               return res.status(400).json({
                  ok: false,
                  msg: 'El servicio no permite solapamiento de turnos'
               });
            }


            const concurrentCount = overlappingAppointments.length;

            const maxAllowed = service.maxConcurrentAppointments || 1;

            if (concurrentCount >= maxAllowed) {
               return res.status(400).json({
                  ok: false,
                  msg: `El servicio permite un máximo de ${maxAllowed} turnos simultáneos`
               });
            }
         }

         const appointment = await Appointment.create({
         service: serviceId,
         professional: professionalId,
         client: clientId,
         start: startDate,
         end: endDate,
         notes,
         status: status || 'confirmed',
         source: source || 'manual',
         business: professional.business
         });

         return res.status(201).json({
         ok: true,
         msg: 'Turno creado correctamente',
         appointment
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
         ok: false,
         msg: 'Error al crear el turno'
         });
      }
   }

   // PUT /api/appointments/:id
   static async updateAppointment(req: Request, res: Response) {
      try {
         const appointment = await Appointment.findById(req.params.id);
         if (!appointment) {
            return res.status(404).json({
               ok: false,
               msg: "Turno no encontrado",
            });
         }

         // Traemos docs actuales (por defecto) o nuevos si los cambian
         const serviceId = req.body.service || appointment.service;
         const professionalId =
            req.body.professional || appointment.professional;
         const clientId = req.body.client || appointment.client;

         const [serviceDoc, professionalDoc, clientDoc] = await Promise.all([
            Service.findById(serviceId),
            Professional.findById(professionalId),
            Client.findById(clientId),
         ]);

         if (!serviceDoc || !professionalDoc || !clientDoc) {
            return res.status(400).json({
               ok: false,
               msg: "Servicio, profesional o cliente inválidos",
            });
         }

         const businessId = professionalDoc.business.toString();

         if (
            serviceDoc.business.toString() !== businessId ||
            clientDoc.business.toString() !== businessId
         ) {
            return res.status(400).json({
               ok: false,
               msg: "Los datos no pertenecen al mismo negocio",
            });
         }

         const professionalServices = professionalDoc.services.map((s) =>
            s.toString()
         );
         if (!professionalServices.includes(serviceDoc._id.toString())) {
            return res.status(400).json({
               ok: false,
               msg: "El profesional no tiene asignado este servicio",
            });
         }

         // start/end: tomamos los nuevos si vienen, sino los existentes
         const startDate = req.body.start
            ? new Date(req.body.start)
            : appointment.start;
         let endDate = req.body.end ? new Date(req.body.end) : appointment.end;

         // si no vino end y cambió el servicio, recalculamos con nueva duración
         if (!req.body.end && req.body.service) {
            endDate = new Date(
               startDate.getTime() + serviceDoc.durationMinutes * 60000
            );
         }

         if (
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime()) ||
            endDate <= startDate
         ) {
            return res.status(400).json({
               ok: false,
               msg: "Rango de fechas inválido",
            });
         }

         // Validar horario laboral
        const isWithinHours = AppointmentController.isWithinWorkingHours(
        professionalDoc,
        startDate,
        endDate
        );

        if (!isWithinHours) {
        return res.status(400).json({
            ok: false,
            msg: 'El turno está fuera del horario laboral del profesional'
        });
        }

        // Validar que no esté en vacaciones/licencia
        const isInTimeOff = AppointmentController.isInTimeOff(
        professionalDoc,
        startDate,
        endDate
        );

        if (isInTimeOff) {
        return res.status(400).json({
            ok: false,
            msg: 'El profesional no está disponible en ese horario (licencia/vacaciones)'
        });
        }


         // ✅ Verificar solapado excluyendo este turno
         const exceeds = await AppointmentController.exceedsOverlapLimit({
            professionalId: professionalDoc._id.toString(),
            serviceId: serviceDoc._id.toString(),
            start: startDate,
            end: endDate,
            allowOverlapProfessional: professionalDoc.allowOverlap ?? false,
            allowOverlapService: serviceDoc.allowOverlap ?? false,
            maxConcurrentAppointments:
               serviceDoc.maxConcurrentAppointments ?? 1,
            excludeId: appointment._id.toString(),
         });

         if (exceeds) {
            return res.status(400).json({
               ok: false,
               msg: "El profesional ya alcanzó el máximo de turnos solapados para este servicio en ese horario",
            });
         }

         // Forzamos business consistente
         req.body.business = businessId;
         req.body.start = startDate;
         req.body.end = endDate;
         req.body.service = serviceDoc._id;
         req.body.professional = professionalDoc._id;
         req.body.client = clientDoc._id;

         const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
         );

         return res.json({
            ok: true,
            msg: "Turno actualizado",
            appointment: updated,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al actualizar el turno",
         });
      }
   }

   // DELETE /api/appointments/:id
   static async deleteAppointment(req: Request, res: Response) {
      try {
         await Appointment.findByIdAndDelete(req.params.id);

         return res.json({
            ok: true,
            msg: "Turno eliminado",
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al eliminar el turno",
         });
      }
   }

   // PATCH /api/appointments/:id/cancel
   static async cancelAppointment(req: Request, res: Response) {
      try {
         const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: "cancelled" },
            { new: true }
         );

         if (!appointment) {
            return res.status(404).json({
               ok: false,
               msg: "Turno no encontrado",
            });
         }

         return res.json({
            ok: true,
            msg: "Turno cancelado",
            appointment,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al cancelar el turno",
         });
      }
   }
}
