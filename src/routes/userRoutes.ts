import { Router } from "express";
import { body } from "express-validator";
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

export default router;
