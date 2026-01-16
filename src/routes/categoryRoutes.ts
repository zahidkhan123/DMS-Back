import { Router } from "express";
import { catchAsync } from "../utils/catch-async.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { getCategories, createCategoryController } from "../controllers/categoryController.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createCategorySchema } from "../validators/categoryValidator.js";

const router = Router();

// Public route - anyone authenticated can view categories
router.get("/", authMiddleware, catchAsync(getCategories));

// Admin only route - create category
router.post("/", authMiddleware, adminMiddleware, validate(createCategorySchema), catchAsync(createCategoryController));

export default router;

