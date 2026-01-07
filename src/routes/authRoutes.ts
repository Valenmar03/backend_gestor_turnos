// routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

router.post("/register-owner", AuthController.registerOwner);
router.post("/login", AuthController.login);

export default router;
