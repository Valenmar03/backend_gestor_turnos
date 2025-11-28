import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateFields } from '../middlewares/validateFields';
import { ProfessionalController } from '../controllers/ProfessionalController';

const router = Router();


router.get('/', ProfessionalController.getAllProfessionals);

router.get(
    '/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    ProfessionalController.getProfessionalById
);

router.post(
    '/',
    body('business', 'El business es obligatorio')
        .notEmpty()
        .isMongoId(),
    body('name', 'El nombre es obligatorio')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 2 }),
    body('email', 'El email debe ser válido')
        .optional({ nullable: true })
        .isEmail(),
    body('phone', 'El teléfono debe ser un string')
        .optional({ nullable: true })
        .isString()
        .trim(),
    body('services', 'services debe ser un array')
        .optional()
        .isArray(),
    body('services.*', 'Cada serviceId debe ser un MongoId válido')
        .optional()
        .isMongoId(),
    body('color', 'El color debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('allowOverlap', 'allowOverlap debe ser booleano')
        .optional()
        .isBoolean(),
    body('workingHours', 'workingHours debe ser un array')
        .optional()
        .isArray(),
    body('workingHours.*.dayOfWeek', 'dayOfWeek debe ser un entero entre 0 y 6')
        .optional()
        .isInt({ min: 0, max: 6 }),
    body('workingHours.*.startTime', 'startTime debe tener formato HH:MM')
        .optional()
        .matches(/^\d{2}:\d{2}$/),
    body('workingHours.*.endTime', 'endTime debe tener formato HH:MM')
        .optional()
        .matches(/^\d{2}:\d{2}$/),
    body('timeOff', 'timeOff debe ser un array')
        .optional()
        .isArray(),
    body('timeOff.*.start', 'timeOff.start debe ser una fecha válida')
        .optional()
        .isISO8601(),
    body('timeOff.*.end', 'timeOff.end debe ser una fecha válida')
        .optional()
        .isISO8601(),
    body('timeOff.*.reason', 'timeOff.reason debe ser un string')
        .optional()
        .isString()
        .trim(),
    validateFields,
    ProfessionalController.createProfessional
);

router.put(
    '/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    body('name', 'El nombre debe ser un string válido')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2 }),
    body('email', 'El email debe ser válido')
        .optional({ nullable: true })
        .isEmail(),
    body('phone', 'El teléfono debe ser un string')
        .optional({ nullable: true })
        .isString()
        .trim(),
    body('services', 'services debe ser un array')
        .optional()
        .isArray(),
    body('services.*', 'Cada serviceId debe ser un MongoId válido')
        .optional()
        .isMongoId(),
    body('color', 'El color debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('allowOverlap', 'allowOverlap debe ser booleano')
        .optional()
        .isBoolean(),
    body('workingHours', 'workingHours debe ser un array')
        .optional()
        .isArray(),
    body('workingHours.*.dayOfWeek', 'dayOfWeek debe ser un entero entre 0 y 6')
        .optional()
        .isInt({ min: 0, max: 6 }),
    body('workingHours.*.startTime', 'startTime debe tener formato HH:MM')
        .optional()
        .matches(/^\d{2}:\d{2}$/),
    body('workingHours.*.endTime', 'endTime debe tener formato HH:MM')
        .optional()
        .matches(/^\d{2}:\d{2}$/),
    body('timeOff', 'timeOff debe ser un array')
        .optional()
        .isArray(),
    body('timeOff.*.start', 'timeOff.start debe ser una fecha válida')
        .optional()
        .isISO8601(),
    body('timeOff.*.end', 'timeOff.end debe ser una fecha válida')
        .optional()
        .isISO8601(),
    body('timeOff.*.reason', 'timeOff.reason debe ser un string')
        .optional()
        .isString()
        .trim(),
    validateFields,
    ProfessionalController.updateProfessional
);

router.delete(
    '/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    ProfessionalController.deleteProfessional
);

router.post(
    '/:id/add-service',
    param('id', 'El id del profesional debe ser un MongoId válido').isMongoId(),
    body('serviceId', 'El serviceId es obligatorio y debe ser un MongoId válido')
        .notEmpty()
        .isMongoId(),
    validateFields,
    ProfessionalController.addService
);

router.post(
    '/:id/timeoff',
    param('id', 'El id del profesional debe ser un MongoId válido').isMongoId(),
    body('start', 'start es obligatorio y debe ser una fecha válida')
        .notEmpty()
        .isISO8601(),
    body('end', 'end es obligatorio y debe ser una fecha válida')
        .notEmpty()
        .isISO8601(),
    body('reason', 'reason debe ser un string')
        .optional()
        .isString()
        .trim(),
    validateFields,
    ProfessionalController.addTimeOff
);

export default router;
