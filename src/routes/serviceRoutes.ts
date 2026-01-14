import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateFields } from '../middlewares/validateFields';
import { ServiceController } from '../controllers/ServiceController';
import { requireAuth } from '../middlewares/requireAuth';
import { requireBusinessScope } from '../middlewares/requireBusinessScope';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

router.use(requireAuth);
router.use(requireBusinessScope);

router.get('/', requireRole("SYS_ADMIN", "OWNER", "BADMIN", "PROFESSIONAL"), ServiceController.getAllServices);

router.get(
    '/:id',
    requireRole("SYS_ADMIN", "OWNER", "BADMIN", "PROFESSIONAL"),
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    ServiceController.getServiceById
);

router.post(
    '/',
    requireRole("SYS_ADMIN", "OWNER"),
    body('business', 'El business es obligatorio')
        .notEmpty()
        .isMongoId(),
    body('name', 'El nombre es obligatorio')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 2 }),
    body('description', 'La descripción debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('durationMinutes', 'La duración es obligatoria y debe ser un entero mayor a 0')
        .notEmpty()
        .isInt({ min: 1 }),
    body('price', 'El precio es obligatorio y debe ser un número mayor o igual a 0')
        .notEmpty()
        .isFloat({ min: 0 }),
    body('category', 'La categoría debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('color', 'El color debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('allowOverlap', 'allowOverlap debe ser booleano')
        .optional()
        .isBoolean(),
    body('maxConcurrentAppointments', 'maxConcurrentAppointments debe ser un entero mayor o igual a 1')
        .optional()
        .isInt({ min: 1 }),
    validateFields,
    ServiceController.createService
);

router.put(
    '/:id',
    requireRole("SYS_ADMIN", "OWNER"),
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    body('name', 'El nombre debe ser un string válido')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2 }),
    body('description', 'La descripción debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('durationMinutes', 'La duración debe ser un entero mayor a 0')
        .optional()
        .isInt({ min: 1 }),
    body('price', 'El precio debe ser un número mayor o igual a 0')
        .optional()
        .isFloat({ min: 0 }),
    body('category', 'La categoría debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('color', 'El color debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('allowOverlap', 'allowOverlap debe ser booleano')
        .optional()
        .isBoolean(),
    body('maxConcurrentAppointments', 'maxConcurrentAppointments debe ser un entero mayor o igual a 1')
        .optional()
        .isInt({ min: 1 }),
    validateFields,
    ServiceController.updateService
);

router.delete(
    '/:id',
    requireRole("SYS_ADMIN", "OWNER"),
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    ServiceController.deleteService
);

export default router;
