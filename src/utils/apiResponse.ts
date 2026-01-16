import { Response } from "express";

const useSuccessResponse = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number
): Response => {
  return res.status(statusCode).json({
    message,
    success: true,
    statusCode,
    data,
  });
};

const useErrorResponse = (
  res: Response,
  message: string,
  statusCode: number,
  errors?: Array<{ field?: string; message: string }>
): Response => {
  const response: any = {
    message,
    success: false,
    statusCode,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export { useSuccessResponse, useErrorResponse };

