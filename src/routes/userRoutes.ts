// routes/users.routes.ts
import { Router } from "express";
import { authorize, requireAuth } from "../middlewares/auth";
import { UserController } from "../controllers/UserController";



const router = Router();

router.use(requireAuth);

// listar: admin/owner
router.get("/", authorize(["owner", "admin"]), UserController.listUsers);

// crear: owner/admin
router.post("/", authorize(["owner", "admin"]), UserController.createUser);

// editar: owner/admin
router.patch("/:id", authorize(["owner", "admin"]), UserController.updateUser);

// reset pass: owner/admin
router.post("/:id/reset-password", authorize(["owner", "admin"]), UserController.adminResetPassword);

export default router;
