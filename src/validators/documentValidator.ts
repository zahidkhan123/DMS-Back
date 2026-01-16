import Joi from "joi";

// Validator for creating a document (upload)
export const createDocumentSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(255)
    .messages({
      "string.empty": "Document name is required",
      "string.min": "Document name must be at least 1 character",
      "string.max": "Document name must not exceed 255 characters",
      "any.required": "Document name is required",
    }),
  description: Joi.string()
    .allow("", null)
    .optional()
    .max(1000)
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  category: Joi.string()
    .allow("", null)
    .optional()
    .max(100)
    .messages({
      "string.max": "Category must not exceed 100 characters",
    }),
});

// Validator for updating document metadata
export const updateDocumentSchema = Joi.object({
  name: Joi.string()
    .optional()
    .trim()
    .min(1)
    .max(255)
    .messages({
      "string.empty": "Document name cannot be empty",
      "string.min": "Document name must be at least 1 character",
      "string.max": "Document name must not exceed 255 characters",
    }),
  description: Joi.string()
    .allow("", null)
    .optional()
    .max(1000)
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  category: Joi.string()
    .allow("", null)
    .optional()
    .max(100)
    .messages({
      "string.max": "Category must not exceed 100 characters",
    }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

