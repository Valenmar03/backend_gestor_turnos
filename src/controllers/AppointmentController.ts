import type { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { Service } from "../models/Service";
import { Professional } from "../models/Professional";
import { Client } from "../models/Client";
import { Business } from "../models/Business";


export class AppointmentController {
   private static timeStringToMinutes(time: string): number {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
   }

   private static applyTime(baseDate: Date, time: string): Date {
      const [h, m] = time.split(":").map(Number);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
   }

   private static rangesOverlap(
      aStart: Date,
      aEnd: Date,
      bStart: Date,
      bEnd: Date
   ): boolean {
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

   private static dayKeyFromDate(d: Date): "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" {

   const map: Array<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"> = [
      "sun",
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat"
   ];
      return map[d.getDay()];
   }

   private static isWithinBusinessOpeningHours(
   business: any,
   start: Date,
   end: Date
   ): boolean {
   if (start.toDateString() !== end.toDateString()) return false;

   const dayKey = this.dayKeyFromDate(start);
   const daySchedule = business.openingHours?.[dayKey];

   if (!daySchedule || !daySchedule.enabled) return false;

   const startMinutes = start.getHours() * 60 + start.getMinutes();
   const endMinutes = end.getHours() * 60 + end.getMinutes();

   const ranges = daySchedule.ranges ?? [];
   if (!ranges.length) return false;

   return ranges.some((r: any) => {
      const rStart = this.timeStringToMinutes(r.startTime);
      const rEnd = this.timeStringToMinutes(r.endTime);
      return startMinutes >= rStart && endMinutes <= rEnd;
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
         return offStart < end && offEnd > start;
      });
   }

   private static isWithinBusinessHours(
      business: any,
      start: Date,
      end: Date
   ): boolean {
      const dayOfWeek = start.getDay();

      if (start.toDateString() !== end.toDateString()) return false;

      const daySchedule =
         business.workingHours?.filter(
            (wh: any) => wh.dayOfWeek === dayOfWeek
         ) ?? [];

      if (!daySchedule.length) return false;

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      return daySchedule.some((wh: any) => {
         const whStart = this.timeStringToMinutes(wh.startTime);
         const whEnd = this.timeStringToMinutes(wh.endTime);
         return startMinutes >= whStart && endMinutes <= whEnd;
      });
   }

   private static async exceedsOverlapLimit(params: {
      businessId: string;              
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
         businessId,
         professionalId,
         serviceId,
         start,
         end,
         allowOverlapProfessional,
         allowOverlapService,
         maxConcurrentAppointments,
         excludeId,
      } = params;

      if (!allowOverlapProfessional || !allowOverlapService || maxConcurrentAppointments <= 1) {
         const filter: any = {
            business: businessId,                 
            professional: professionalId,
            status: { $ne: "cancelled" },
            start: { $lt: end },
            end: { $gt: start },
         };
         if (excludeId) filter._id = { $ne: excludeId };

         const existing = await Appointment.findOne(filter);
         return !!existing;
      }

      const filter: any = {
         business: businessId,                   
         professional: professionalId,
         service: serviceId,
         status: { $ne: "cancelled" },
         start: { $lt: end },
         end: { $gt: start },
      };
      if (excludeId) filter._id = { $ne: excludeId };

      const count = await Appointment.countDocuments(filter);
      return count >= maxConcurrentAppointments;
   }  


   static async getAllAppointments(req: Request, res: Response) {
      try {
         console.log(req.user)
         if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

         const { professionalId, from, to, businessId: businessIdFromQuery } = req.query as any;

         const filter: any = {};

         if (req.user.role === "SYS_ADMIN") {
            if (businessIdFromQuery) filter.business = businessIdFromQuery;
         } else {
            if (!req.user.businessId) {
            return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
            }
            filter.business = req.user.businessId;
         }

         if (professionalId) filter.professional = professionalId;

         if (from || to) {
            filter.start = {};
            if (from) filter.start.$gte = new Date(from);
            if (to) filter.start.$lte = new Date(to);
         }

         const appointments = await Appointment.find(filter)
            .populate("service")
            .populate("professional")
            .populate("client")
            .sort({ start: 1 });

         return res.json({ ok: true, appointments });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al obtener los turnos" });
      }
      }


   static async getAppointmentById(req: Request, res: Response) {
      try {
         if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

         const filter: any = { _id: req.params.id };

         if (req.user.role !== "SYS_ADMIN") {
            if (!req.user.businessId) {
            return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
            }
            filter.business = req.user.businessId;
         }

         const appointment = await Appointment.findOne(filter)
            .populate("service")
            .populate("professional")
            .populate("client");

         if (!appointment) {
            return res.status(404).json({ ok: false, msg: "Turno no encontrado" });
         }

         return res.json({ ok: true, appointment });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al obtener el turno" });
      }
}


   static async createAppointment(req: Request, res: Response) {
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

         const { service, professional, client, start, end, notes, source, status } = req.body as {
            service: string;
            professional: string;
            client: string;
            start: string;
            end?: string; 
            notes?: string;
            source?: "manual" | "online";
            status?: "pending" | "confirmed" | "cancelled" | "completed";
            business?: string;
         };

         const [serviceDoc, profDoc, clientDoc, business] = await Promise.all([
            Service.findOne({ _id: service, business: businessId, isActive: true }),
            Professional.findOne({ _id: professional, business: businessId }),
            Client.findOne({ _id: client, business: businessId }),
            Business.findById(businessId),
         ]);

         if (!business) {
            return res.status(404).json({ ok: false, msg: "Negocio no encontrado" });
         }
         if (!business.isActive) {
            return res.status(400).json({ ok: false, msg: "El negocio no está activo" });
         }

         if (!serviceDoc) {
            return res.status(404).json({
            ok: false,
            msg: "Servicio no encontrado, no pertenece a tu negocio o está desactivado",
            });
         }

         if (!profDoc) {
            return res.status(404).json({
            ok: false,
            msg: "Profesional no encontrado o no pertenece a tu negocio",
            });
         }

         if (!clientDoc) {
            return res.status(404).json({
            ok: false,
            msg: "Cliente no encontrado o no pertenece a tu negocio",
            });
         }

         const professionalServices = (profDoc.services ?? []).map((s: any) => s.toString());
         if (!professionalServices.includes(serviceDoc._id.toString())) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional no tiene asignado este servicio",
            });
         }

         const startDate = new Date(start);
         if (Number.isNaN(startDate.getTime())) {
            return res.status(400).json({ ok: false, msg: "start inválido (ISO date)" });
         }

         let endDate: Date;
         if (end) {
            endDate = new Date(end);
            if (Number.isNaN(endDate.getTime())) {
            return res.status(400).json({ ok: false, msg: "end inválido (ISO date)" });
            }
         } else {
            endDate = new Date(startDate.getTime() + serviceDoc.durationMinutes * 60000);
         }

         if (endDate <= startDate) {
            return res.status(400).json({ ok: false, msg: "end debe ser mayor a start" });
         }

         const withinBusinessHours =
            AppointmentController.isWithinBusinessOpeningHours(business, startDate, endDate);

         if (!withinBusinessHours) {
            return res.status(400).json({
            ok: false,
            msg: "El turno está fuera del horario del negocio",
            });
         }

         const isWithinHours = AppointmentController.isWithinWorkingHours(profDoc, startDate, endDate);
         if (!isWithinHours) {
            return res.status(400).json({
            ok: false,
            msg: "El turno está fuera del horario laboral del profesional",
            });
         }

         const isInTimeOff = AppointmentController.isInTimeOff(profDoc, startDate, endDate);
         if (isInTimeOff) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional no está disponible en ese horario (licencia/vacaciones)",
            });
         }

         const exceeds = await AppointmentController.exceedsOverlapLimit({
            businessId,
            professionalId: profDoc._id.toString(),
            serviceId: serviceDoc._id.toString(),
            start: startDate,
            end: endDate,
            allowOverlapProfessional: profDoc.allowOverlap ?? false,
            allowOverlapService: serviceDoc.allowOverlap ?? false,
            maxConcurrentAppointments: serviceDoc.maxConcurrentAppointments ?? 1,
         });

         if (exceeds) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional ya alcanzó el máximo de turnos solapados para este servicio en ese horario",
            });
         }

         const appointment = await Appointment.create({
            business: businessId,
            service: serviceDoc._id,
            professional: profDoc._id,
            client: clientDoc._id,
            start: startDate,
            end: endDate,
            notes: notes?.trim(),
            source: source ?? "manual",
            status: status ?? "confirmed",
         });

         return res.status(201).json({ ok: true, msg: "Turno creado", appointment });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al crear turno" });
      }
      }

   static async updateAppointment(req: Request, res: Response) {
      try {
         if (!req.user) {
            return res.status(401).json({ ok: false, msg: "No autenticado" });
         }

         const businessIdFromToken =
            req.user.role === "SYS_ADMIN"
            ? (req.body.business as string | undefined) ?? null
            : req.user.businessId;

         if (!businessIdFromToken) {
            return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
         }

         const appointment = await Appointment.findOne({
            _id: req.params.id,
            business: businessIdFromToken,
         });

         if (!appointment) {
            return res.status(404).json({ ok: false, msg: "Turno no encontrado" });
         }

         const serviceId = req.body.service || appointment.service;
         const professionalId = req.body.professional || appointment.professional;
         const clientId = req.body.client || appointment.client;

         const [serviceDoc, professionalDoc, clientDoc, business] = await Promise.all([
            Service.findOne({ _id: serviceId, business: businessIdFromToken, isActive: true }),
            Professional.findOne({ _id: professionalId, business: businessIdFromToken }),
            Client.findOne({ _id: clientId, business: businessIdFromToken }),
            Business.findById(businessIdFromToken),
         ]);

         if (!business) {
            return res.status(404).json({ ok: false, msg: "Negocio no encontrado" });
         }

         if (!business.isActive) {
            return res.status(400).json({ ok: false, msg: "El negocio no está activo" });
         }

         if (!serviceDoc || !professionalDoc || !clientDoc) {
            return res.status(400).json({
            ok: false,
            msg: "Servicio, profesional o cliente inválidos (o no pertenecen a tu negocio)",
            });
         }

         const professionalServices = (professionalDoc.services ?? []).map((s: any) => s.toString());
         if (!professionalServices.includes(serviceDoc._id.toString())) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional no tiene asignado este servicio",
            });
         }

         const startDate = req.body.start ? new Date(req.body.start) : appointment.start;
         let endDate = req.body.end ? new Date(req.body.end) : appointment.end;

         if (!req.body.end && req.body.service) {
            endDate = new Date(startDate.getTime() + serviceDoc.durationMinutes * 60000);
         }

         if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
            return res.status(400).json({ ok: false, msg: "Rango de fechas inválido" });
         }

         const withinBusinessHours = AppointmentController.isWithinBusinessOpeningHours(
            business,
            startDate,
            endDate
         );

         if (!withinBusinessHours) {
            return res.status(400).json({
            ok: false,
            msg: "El turno está fuera del horario del negocio",
            });
         }

         const isWithinHours = AppointmentController.isWithinWorkingHours(
            professionalDoc,
            startDate,
            endDate
         );

         if (!isWithinHours) {
            return res.status(400).json({
            ok: false,
            msg: "El turno está fuera del horario laboral del profesional",
            });
         }

         const isInTimeOff = AppointmentController.isInTimeOff(
            professionalDoc,
            startDate,
            endDate
         );

         if (isInTimeOff) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional no está disponible en ese horario (licencia/vacaciones)",
            });
         }

         const exceeds = await AppointmentController.exceedsOverlapLimit({
            businessId: businessIdFromToken, 
            professionalId: professionalDoc._id.toString(),
            serviceId: serviceDoc._id.toString(),
            start: startDate,
            end: endDate,
            allowOverlapProfessional: professionalDoc.allowOverlap ?? false,
            allowOverlapService: serviceDoc.allowOverlap ?? false,
            maxConcurrentAppointments: serviceDoc.maxConcurrentAppointments ?? 1,
            excludeId: appointment._id.toString(),
         });

         if (exceeds) {
            return res.status(400).json({
            ok: false,
            msg: "El profesional ya alcanzó el máximo de turnos solapados para este servicio en ese horario",
            });
         }

         const updateData: any = {
            business: businessIdFromToken,
            start: startDate,
            end: endDate,
            service: serviceDoc._id,
            professional: professionalDoc._id,
            client: clientDoc._id,
         };
         if (typeof req.body.notes === "string") updateData.notes = req.body.notes.trim();
         if (req.body.notes === null || req.body.notes === "") updateData.notes = undefined;

         if (req.body.source) updateData.source = req.body.source;
         if (req.body.status) updateData.status = req.body.status;

         const updated = await Appointment.findOneAndUpdate(
            { _id: appointment._id, business: businessIdFromToken }, 
            updateData,
            { new: true }
         );

         return res.json({
            ok: true,
            msg: "Turno actualizado",
            appointment: updated,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al actualizar el turno" });
      }
      }



   static async deleteAppointment(req: Request, res: Response) {
   try {
      if (!req.user) {
         return res.status(401).json({ ok: false, msg: "No autenticado" });
      }

      const filter: any = { _id: req.params.id };

      if (req.user.role !== "SYS_ADMIN") {
         if (!req.user.businessId) {
         return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
         }
         filter.business = req.user.businessId;
      }

      const appointment = await Appointment.findOneAndUpdate(
         filter,
         { status: "cancelled" },
         { new: true }
      );

      if (!appointment) {
         return res.status(404).json({ ok: false, msg: "Turno no encontrado" });
      }

      return res.json({
         ok: true,
         msg: "Turno cancelado (borrado lógico)",
         appointment,
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, msg: "Error al cancelar el turno" });
   }
   }


   static async cancelAppointment(req: Request, res: Response) {
      try {
         if (!req.user) return res.status(401).json({ ok: false, msg: "No autenticado" });

         const filter: any = { _id: req.params.id };

         if (req.user.role !== "SYS_ADMIN") {
            if (!req.user.businessId) {
            return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
            }
            filter.business = req.user.businessId;
         }

         const appointment = await Appointment.findOneAndUpdate(
            filter,
            { status: "cancelled" },
            { new: true }
         );

         if (!appointment) {
            return res.status(404).json({ ok: false, msg: "Turno no encontrado" });
         }

         return res.json({ ok: true, msg: "Turno cancelado", appointment });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al cancelar el turno" });
      }
      }

}
