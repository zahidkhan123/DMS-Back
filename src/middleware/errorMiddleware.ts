import { Request, Response, NextFunction } from "express";
import { useErrorResponse } from "../utils/apiResponse.js";
import Joi from "joi";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Joi validation errors
  if (err.isJoi || err instanceof Joi.ValidationError) {
    const errors = err.details?.map((detail: any) => ({
      field: detail.path.join("."),
      message: detail.message,
    })) || [{ message: err.message }];

    useErrorResponse(
      res,
      "Validation error",
      400,
      errors
    );
    return;
  }

  // Handle other known error types
  if (err.statusCode) {
    useErrorResponse(res, err.message || "An error occurred", err.statusCode);
    return;
  }

  // Handle Sequelize validation errors
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    const errors = err.errors?.map((error: any) => ({
      field: error.path,
      message: error.message,
    })) || [{ message: err.message }];

    useErrorResponse(
      res,
      "Validation error",
      400,
      errors
    );
    return;
  }

  // Default error response
  useErrorResponse(
    res,
    err.message || "Internal server error",
    500
  );
};

