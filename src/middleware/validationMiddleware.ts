import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { useErrorResponse } from "../utils/apiResponse.js";

type ValidationSource = "body" | "query" | "params";

export const validate = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: Joi.ValidationErrorItem) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      useErrorResponse(
        res,
        "Validation error",
        400,
        errors
      );
      return;
    }

    // Replace the original data with validated and sanitized data
    if (source === "body") {
      req.body = value;
    } else if (source === "query") {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};

