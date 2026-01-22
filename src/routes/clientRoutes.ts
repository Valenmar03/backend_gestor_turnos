import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { validateFields } from '../middlewares/validateFields';
import { body, param } from 'express-validator';
import { requireAuth } from '../middlewares/requireAuth';
import { requireBusinessScope } from '../middlewares/requireBusinessScope';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

router.use(requireAuth);
router.use(requireBusinessScope);

router.get("/", ClientController.getAllClients);

router.get("/:id",
  param("id").isMongoId(),
  validateFields,
  ClientController.getClientById
);

router.post(
  "/",
  requireRole("SYS_ADMIN", "OWNER", "BADMIN"),
  body("name").notEmpty().isString().trim(),
  body("phone").notEmpty().isString().trim(),
  body("email").optional().isEmail(),
  body("notes").optional().isString().trim(),
  validateFields,
  ClientController.createClient
);

router.put(
  "/:id",
  requireRole("SYS_ADMIN", "OWNER", "BADMIN"),
  param("id").isMongoId(),
  body("name").notEmpty().isString().trim(),
  body("phone").notEmpty().isString().trim(),
  body("email").optional().isEmail(),
  body("notes").optional().isString().trim(),
  validateFields,
  ClientController.updateClient
);


router.delete(
  "/:id",
  requireRole("SYS_ADMIN", "OWNER", "BADMIN"),
  param("id").isMongoId(),
  validateFields,
  ClientController.deleteClient
);

export default router;
