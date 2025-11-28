import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { validateFields } from '../middlewares/validateFields';
import { body, param } from 'express-validator';

const router = Router();

router.get('/', ClientController.getAllClients);
router.get('/:id', param('id', 'El id debe ser un MongoId válido').isMongoId(), validateFields, ClientController.getClientById);

router.post('/',
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
    validateFields, ClientController.createClient);

router.put('/:id',
    param('id', 'El id debe ser un MongoId válido').isMongoId(),
    body('name', 'El nombre debe ser un string')
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
        .trim()
    ,validateFields, ClientController.updateClient);
router.delete('/:id', param('id', 'El id debe ser un MongoId válido').isMongoId(), validateFields, ClientController.deleteClient);

export default router;
