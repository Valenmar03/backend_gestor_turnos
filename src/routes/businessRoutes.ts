import { Router } from "express";
import { BusinessController } from "../controllers/BusinessController";
import { body, param } from "express-validator";
import { validateFields } from "../middlewares/validateFields";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireBusinessScope } from "../middlewares/requireBusinessScope";

const router = Router();

router.get("/", requireAuth, requireRole("SYS_ADMIN"), BusinessController.getAllBusiness);

router.get("/me", requireAuth, BusinessController.getMyBusiness);

router.get(
    "/:id",
    requireAuth,
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    requireBusinessScope,
    BusinessController.getBusinessById
);


router.post(
    "/",
    requireAuth,
    requireRole("SYS_ADMIN"),
    body("name", "El nombre es obligatorio").notEmpty().isString().trim().isLength({ min: 2 }),
    body("email", "El email debe ser válido").optional({ nullable: true }).isEmail(),
    body("phone", "El teléfono debe ser un string").optional({ nullable: true }).isString().trim(),
    body("address", "La dirección debe ser un string").optional().isString().trim(),
    body("timezone", "El timezone debe ser un string válido").optional().isString().trim(),
    validateFields,
    BusinessController.createBusiness
);

router.put(
    "/:id",
    requireAuth,
    requireRole("SYS_ADMIN", "OWNER"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    requireBusinessScope,
    body("name").optional().isString().trim().isLength({ min: 2 }),
    body("email").optional({ nullable: true }).isEmail(),
    body("phone").optional({ nullable: true }).isString().trim(),
    body("address").optional().isString().trim(),
    body("timezone").optional().isString().trim(),
    validateFields,
    BusinessController.updateBusiness
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("SYS_ADMIN"),
    param("id", "El id debe ser un MongoId válido").isMongoId(),
    validateFields,
    BusinessController.deleteBusiness
);

export default router;
