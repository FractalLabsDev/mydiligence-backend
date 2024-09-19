import { Request } from 'express';

export const getToken = (req: Request): string => {
  const { authorization } = req.headers;
  const token = authorization?.split(' ')[1] ?? "";
  return token;
}
