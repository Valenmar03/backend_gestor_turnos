import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/login", AuthController.login);
router.get("/me", requireAuth, AuthController.me);

export default router;
