import express from 'express';

export function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.error('[Error]', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
}
