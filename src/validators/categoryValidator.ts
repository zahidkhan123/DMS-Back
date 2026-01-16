import Joi from "joi";

// Validator for creating a category
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(100)
    .messages({
      "string.empty": "Category name is required",
      "string.min": "Category name must be at least 1 character",
      "string.max": "Category name must not exceed 100 characters",
      "any.required": "Category name is required",
    }),
  color: Joi.string()
    .optional()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#6366f1")
    .messages({
      "string.pattern.base": "Color must be a valid hex color code (e.g., #6366f1)",
    }),
});

