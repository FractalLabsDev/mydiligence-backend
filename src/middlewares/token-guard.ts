import { NextFunction, Request, Response } from "express";
import { expressjwt as jwt } from "express-jwt";
import jwtAuthz from 'express-jwt-authz';
import config from "../config/jwt";
import {
  getUser,
} from "../services/internal/user.service";
import { getEnvironment } from '../utils/env';

export const checkJwt = () => {
  const jwtRequestHandler = jwt({
    secret: config.jwtSecret,
    algorithms: ['HS256']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    jwtRequestHandler(req, res, async (err) => {
      if (err) {
        // Handle JWT validation errors
        if (err.name === 'UnauthorizedError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return next(err);
      }

      const { id } = req.auth as any;
      try {
        const user = await getUser(id);
        // Custom logic: Check if the user is activated
        if (!user.activated && getEnvironment() !== "local") {
          return res.status(401).json({ error: 'User not activated' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid tokens' });
      }
      // Continue with the next middleware in the chain
      next();
    });
  };
};

export type TScope = 'user' | 'admin' | 'one-time';
export const checkRole = (scopes: TScope[]) => jwtAuthz(scopes, { customUserKey: 'auth', failWithError: true });
;
