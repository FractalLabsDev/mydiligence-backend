import express from 'express';
import { ExpressJoiError } from 'express-joi-validation';
import { ValidationError } from 'joi';
import ApiError from './ApiError';
import * as WrapResponse from './wrapResponse';

const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  // Unauthorized
  if (err && err.name === 'UnauthorizedError') {
    res.status(401).json(WrapResponse.wrapErrorMessage(err.message));
  }
  if (err && err.error === 'Forbidden') {
    res.status(403).json(WrapResponse.wrapErrorMessage(err.message));
  }
  // Validation error
  if (err?.name === 'ValidationError') {
    const e: ValidationError = err;
    return res.status(400).json(WrapResponse.wrapErrorMessage(e.details.map((x) => x.message).join(', ')));
  }
  if (err && err.error && err.error.isJoi) {
    const e: ExpressJoiError = err;
    return res.status(400).json(WrapResponse.wrapErrorMessage(e?.error?.message || ""));
  }
  // Internal server error
  if (err instanceof ApiError) {
    return res.status(err.status).json(WrapResponse.wrapErrorMessage(err.message));
  }

  next(err);
};

export default errorHandler;
