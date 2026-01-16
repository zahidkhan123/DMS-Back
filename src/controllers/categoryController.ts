import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { useSuccessResponse, useErrorResponse } from "../utils/apiResponse.js";
import { getAllCategories, createCategory } from "../services/categoryService.js";
import { emitCategoryUpdated } from "../services/socketService.js";

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getAllCategories();
    
    // getAllCategories returns { categories: [...] }
    // Extract the categories array
    const categories = result?.categories || [];
    
    useSuccessResponse(res, "Categories retrieved successfully", { categories }, 200);
  } catch (error: any) {
    useErrorResponse(res, error.message || "Failed to retrieve categories", 500);
  }
};

export const createCategoryController = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      useErrorResponse(res, "Category name is required", 400);
      return;
    }

    const category = await createCategory(name.trim(), color || "#6366f1");

    // Emit real-time category update event
    await emitCategoryUpdated(category.toJSON());

    useSuccessResponse(res, "Category created successfully", { category }, 201);
  } catch (error: any) {
    useErrorResponse(res, error.message || "Failed to create category", 500);
  }
};

