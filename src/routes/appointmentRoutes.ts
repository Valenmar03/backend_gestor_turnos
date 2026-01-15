import { Router } from "express";
import { body, param, query } from "express-validator";
import { validateFields } from "../middlewares/validateFields";
import { AppointmentController } from "../controllers/AppointmentController";
import { requireBusinessScope } from "../middlewares/requireBusinessScope";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.use(requireAuth);
router.use(requireBusinessScope);

router.get(
    "/",
    requireRole("SYS_ADMIN","OWNER","BADMIN","PROFESSIONAL"),
    query("businessId", "businessId debe ser un MongoId válido")
        .optional()
        .isMongoId(),
    query("professionalId", "professionalId debe ser un MongoId válido")
        .optional()
        .isMongoId(),
    query("from", "from debe ser una fecha válida (ISO)").optional().isISO8601(),
    query("to", "to debe ser una fecha válida (ISO)").optional().isISO8601(),
    validateFields,
    AppointmentController.getAllAppointments
);

router.get(
    "/:id",
    requireRole("SYS_ADMIN","OWNER","BADMIN","PROFESSIONAL"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    AppointmentController.getAppointmentById
);

// POST /api/appointments
router.post(
    "/",
    requireRole("SYS_ADMIN","OWNER","BADMIN"),
    body("service", "El service es obligatorio y debe ser un MongoId válido")
        .notEmpty()
        .isMongoId(),
    body(
        "professional",
        "El professional es obligatorio y debe ser un MongoId válido"
    )
        .notEmpty()
        .isMongoId(),
    body("client", "El client es obligatorio y debe ser un MongoId válido")
        .notEmpty()
        .isMongoId(),
    body("start", "start es obligatorio y debe ser una fecha válida (ISO)")
        .notEmpty()
        .isISO8601(),
    body("end", "end debe ser una fecha válida (ISO)").optional().isISO8601(),
    body(
        "status",
        "status debe ser uno de: pending, confirmed, cancelled, completed"
    )
        .optional()
        .isIn(["pending", "confirmed", "cancelled", "completed"]),
    body("source", "source debe ser uno de: manual, online")
        .optional()
        .isIn(["manual", "online"]),
    body("notes", "notes debe ser un string").optional().isString().trim(),
    validateFields,
    AppointmentController.createAppointment
);

router.put(
    "/:id",
    requireRole("SYS_ADMIN","OWNER","BADMIN"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    body("service", "El service debe ser un MongoId válido")
        .optional()
        .isMongoId(),
    body("professional", "El professional debe ser un MongoId válido")
        .optional()
        .isMongoId(),
    body("client", "El client debe ser un MongoId válido")
        .optional()
        .isMongoId(),
    body("start", "start debe ser una fecha válida (ISO)")
        .optional()
        .isISO8601(),
    body("end", "end debe ser una fecha válida (ISO)").optional().isISO8601(),
    body(
        "status",
        "status debe ser uno de: pending, confirmed, cancelled, completed"
    )
        .optional()
        .isIn(["pending", "confirmed", "cancelled", "completed"]),
    body("source", "source debe ser uno de: manual, online")
        .optional()
        .isIn(["manual", "online"]),
    body("notes", "notes debe ser un string").optional().isString().trim(),
    validateFields,
    AppointmentController.updateAppointment
);

router.delete(
    "/:id",
    requireRole("SYS_ADMIN","OWNER","BADMIN"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    AppointmentController.deleteAppointment
);

router.patch(
    "/:id/cancel",
    requireRole("SYS_ADMIN","OWNER","BADMIN"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    AppointmentController.cancelAppointment
);

export default router;
