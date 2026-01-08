import { Router } from "express";
import { body, param } from "express-validator";
import { UserController } from "../controllers/UserController";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { validateFields } from "../middlewares/validateFields";

const router = Router();

// Crear usuario: SYS_ADMIN o OWNER
router.post(
    "/",
    requireAuth,
    requireRole("SYS_ADMIN", "OWNER"),
    body("name", "name es requerido").notEmpty().isString().trim().isLength({ min: 2 }),
    body("email", "email inválido").notEmpty().isEmail(),
    body("role", "role es requerido").notEmpty().isString(),
    body("businessId").optional().isMongoId(),
    body("password").optional().isString().isLength({ min: 6 }),
    body("isBookable").optional().isBoolean(),
    validateFields,
    UserController.createUser
);

router.get(
    "/",
    requireAuth,
    requireRole("SYS_ADMIN", "OWNER"),
    UserController.getUsers
);

router.patch(
    "/:id/status",
    requireAuth,
    requireRole("SYS_ADMIN", "OWNER"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    body("isActive", "isActive debe ser boolean").isBoolean(),
    validateFields,
    UserController.setUserStatus
);

router.patch(
    "/:id/role",
    requireAuth,
    requireRole("SYS_ADMIN", "OWNER"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    body("role", "role es requerido").notEmpty().isString(),
    validateFields,
    UserController.setUserRole
);

export default router;
