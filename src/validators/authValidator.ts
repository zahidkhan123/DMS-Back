import Joi from "joi";

// Validator for user registration
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .required()
    .min(6)
    .max(100)
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password must not exceed 100 characters",
      "any.required": "Password is required",
    }),
  name: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(100)
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 1 character",
      "string.max": "Name must not exceed 100 characters",
      "any.required": "Name is required",
    }),
  role: Joi.string()
    .optional()
    .valid("user", "admin")
    .messages({
      "any.only": "Role must be either 'user' or 'admin'",
    }),
  user_type: Joi.string()
    .optional()
    .valid("user", "admin")
    .messages({
      "any.only": "User type must be either 'user' or 'admin'",
    }),
});

// Validator for user login
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

