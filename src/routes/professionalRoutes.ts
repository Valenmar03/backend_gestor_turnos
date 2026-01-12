import { Router } from "express";
import { body, param } from "express-validator";
import { validateFields } from "../middlewares/validateFields";
import { ProfessionalController } from "../controllers/ProfessionalController";
import { requireAuth } from "../middlewares/requireAuth";
import { requireBusinessScope } from "../middlewares/requireBusinessScope";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/", requireAuth, requireBusinessScope, ProfessionalController.getAllProfessionals);

router.get(
  "/:id",
  requireAuth,
  requireBusinessScope,
  param("id", "El id debe ser un MongoId válido").isMongoId(),
  validateFields,
  ProfessionalController.getProfessionalById
);

router.put(
  "/:id",
  requireAuth,
  requireRole("SYS_ADMIN", "OWNER"),
  param("id", "El id debe ser un MongoId válido").isMongoId(),

  body("services").optional().isArray(),
  body("services.*").optional().isMongoId(),

  body("color").optional().isString().trim(),
  body("allowOverlap").optional().isBoolean(),

  body("workingHours").optional().isArray(),
  body("workingHours.*.dayOfWeek").optional().isInt({ min: 0, max: 6 }),
  body("workingHours.*.startTime").optional().matches(/^\d{2}:\d{2}$/),
  body("workingHours.*.endTime").optional().matches(/^\d{2}:\d{2}$/),

  body("timeOff").optional().isArray(),
  body("timeOff.*.start").optional().isISO8601(),
  body("timeOff.*.end").optional().isISO8601(),
  body("timeOff.*.reason").optional().isString().trim(),

  validateFields,
  ProfessionalController.updateProfessional
);


router.post(
  "/:id/add-service",
  requireAuth,
  requireRole("SYS_ADMIN", "OWNER"),
  param("id", "El id del profesional debe ser un MongoId válido").isMongoId(),
  body("serviceId", "El serviceId es obligatorio y debe ser un MongoId válido").notEmpty().isMongoId(),
  validateFields,
  ProfessionalController.addService
);

router.post(
  "/:id/timeoff",
  requireAuth,
  requireRole("SYS_ADMIN", "OWNER"),
  param("id", "El id del profesional debe ser un MongoId válido").isMongoId(),
  body("start", "start es obligatorio y debe ser una fecha válida").notEmpty().isISO8601(),
  body("end", "end es obligatorio y debe ser una fecha válida").notEmpty().isISO8601(),
  body("reason").optional().isString().trim(),
  validateFields,
  ProfessionalController.addTimeOff
);

export default router;
