import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, path, query, body } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method,
        path,
        query,
        status: res.statusCode,
        duration: `${duration}ms`,
      })
    );
  });

  next();
};
