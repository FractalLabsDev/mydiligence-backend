import config from "@/config/jwt";
import User from "@/db/models/user.model";
import * as jwt from "jsonwebtoken";
import { TScope } from "../middlewares/token-guard";
import { getUser } from "../services/internal/user.service";

export const issueToken = (userId: string | number, role: TScope | TScope[] = "user") => {
  const expiresIn = role === "one-time" ? '5m' : process.env.JWT_EXPIRATION;

  const token = jwt.sign({
    id: userId,
    scope: Array.isArray(role) ? role : [role]
  }, config.jwtSecret as jwt.Secret,
    { expiresIn }
  );

  if (role === "one-time") return { token };

  const refreshToken = jwt.sign({
    id: userId,
    scope: Array.isArray(role) ? role : [role]
  }, config.jwtSecret as jwt.Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION
  });

  return { token, refreshToken };
}

export const getScope = async (user: User): Promise<TScope | TScope[]> => {
  if (user.isAdmin) {
    return ['admin', 'user'];
  }
  return 'user';
}

export const getScopeByUserId = async (userId: string) => {
  const user = await getUser(userId);
  return await getScope(user);
}
