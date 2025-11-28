import { Router } from 'express'
import { BusinessController } from '../controllers/BusinessController'
import { body, param } from 'express-validator';
import { validateFields } from '../middlewares/validateFields';

const router = Router()

router.get('/', BusinessController.getAllBusiness);
router.get(
    '/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    BusinessController.getBusinessById
);

router.post(
    '/',
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
    body('address', 'La dirección debe ser un string')
        .optional()
        .isString()
        .trim(),
    body('timezone', 'El timezone debe ser un string válido')
        .optional()
        .isString()
        .trim(),
    validateFields,
    BusinessController.createBusiness
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
    body('address', 'La dirección debe ser un string válido')
        .optional()
        .isString()
        .trim(),
    body('timezone', 'El timezone debe ser un string válido')
        .optional()
        .isString()
        .trim(),
    validateFields,
    BusinessController.updateBusiness
);

router.delete(
    '/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    validateFields,
    BusinessController.deleteBusiness
);


export default router