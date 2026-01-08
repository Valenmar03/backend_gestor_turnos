import type { Request, Response } from "express";
import { Business } from "../models/Business";

export class BusinessController {
   // GET /api/business
   static async getAllBusiness(req: Request, res: Response) {
      try {
         const businesses = await Business.find().sort({ createdAt: -1 });

         return res.json({
            ok: true,
            businesses,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al obtener los negocios",
         });
      }
   }

   // GET /api/business/:id
   static async getBusinessById(req: Request, res: Response) {
      try {
         const business = await Business.findById(req.params.id);

         if (!business) {
            return res
               .status(404)
               .json({ ok: false, msg: "Negocio no encontrado" });
         }

         return res.json({ ok: true, business });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al obtener el negocio",
         });
      }
   }

   // POST /api/business
   static async createBusiness(req: Request, res: Response) {
      try {
         const business = await Business.create(req.body);

         return res.status(201).json({
            ok: true,
            msg: "Negocio creado correctamente",
            business,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al crear el negocio",
         });
      }
   }

   // PUT /api/business/:id
   static async updateBusiness(req: Request, res: Response) {
      try {
         const business = await Business.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
         );

         return res.json({
            ok: true,
            msg: "Negocio actualizado",
            business,
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al actualizar el negocio",
         });
      }
   }

   // DELETE /api/business/:id
   static async deleteBusiness(req: Request, res: Response) {
      try {
         await Business.findByIdAndDelete(req.params.id);

         return res.json({
            ok: true,
            msg: "Negocio eliminado",
         });
      } catch (error) {
         console.error(error);
         return res.status(500).json({
            ok: false,
            msg: "Error al eliminar el negocio",
         });
      }
   }

   static async getMyBusiness(req: Request, res: Response) {
      try {
         if (!req.user) {
            return res.status(401).json({ ok: false, msg: "No autenticado" });
         }

         const businessId = req.user.businessId;
         if (!businessId) {
            return res.status(403).json({ ok: false, msg: "Usuario sin negocio asignado" });
         }

         const business = await Business.findById(businessId);

         if (!business) {
            return res.status(404).json({ ok: false, msg: "Negocio no encontrado" });
         }

         return res.json({ ok: true, business });
      } catch (error) {
         console.error(error);
         return res.status(500).json({ ok: false, msg: "Error al obtener el negocio" });
      }
   }
}
