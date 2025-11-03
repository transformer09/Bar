import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // API errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Default server error
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.',
  });
};
