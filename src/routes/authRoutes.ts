import { Router } from "express";
import { catchAsync } from "../utils/catch-async.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { register, login, getProfile, refreshSession } from "../controllers/authController.js";
import { validate } from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";

const router = Router();

router.post("/register", validate(registerSchema), catchAsync(register));
router.post("/login", validate(loginSchema), catchAsync(login));
router.get("/profile", authMiddleware, catchAsync(getProfile));
router.post("/refresh", authMiddleware, catchAsync(refreshSession));

export default router;

