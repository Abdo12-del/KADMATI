import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Log the error stack for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';
  const errors = err.errors || null; // Ensure validation errors are included

  res.status(statusCode).json({
    success: false,
    message,
    errors, // Now explicitly includes the errors array
  });
};

// Custom Error Class for API errors
export class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number = 400, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}