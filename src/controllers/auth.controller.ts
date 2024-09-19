import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import * as jwt from "jsonwebtoken";
import { decode } from "jsonwebtoken";
import _ from "lodash";

import { getScope, getScopeByUserId, issueToken } from "@/lib/auth";
import { getVerificationCode, verifyCode } from '@/services/external/twilio.service';
import { activateUser, createUser, deleteUser, getUserByEmail, updatePassword } from '@/services/internal/user.service';
import { getEnvironment } from '@/utils/env';
import { getToken } from "@/utils/token";
import configJwt from '../config/jwt';
import APIError from '../lib/ApiError';
import * as WrapResponse from '../lib/wrapResponse';

/**
 * POST api/v1/auth/enterEmail
 * @param req
 * @param res
 */
export const EnterEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      const whitelistedDomains = ['fractallabs.dev'];
      const whitelistedEmails = [''];
      const domain = email.substring(email.lastIndexOf("@") + 1);
      const isWhitelisted = whitelistedEmails.includes(email) || whitelistedDomains.includes(domain);
      if (isWhitelisted) {
        return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('Email not found, user whitelisted'));
      } else {
        return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('User not whitelisted'));
      }
    }
    const json = { activated: user.activated };
    return res.status(HttpStatusCodes.OK).json(WrapResponse.wrap(json, 'Email found'));
  } catch (error: any) {
    console.error("❌ Error while looking up email: ", error);
    return next(new APIError(error));
  }
}

/**
 * POST api/v1/auth/signIn
 * @param req
 * @param res
 */
export const SignIn = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('Email not found'));
    }

    if (!user.activated && getEnvironment() !== "local") {
      await getVerificationCode(email);
      return res.send(WrapResponse.wrapMessage('Verification code requested successfully'));
    }

    const isEqualPassword = await bcrypt.compare(password, user.password);

    if (isEqualPassword) {
      const json = {
        user,
        ...issueToken(user.id, await getScope(user))
      }
      return res.status(HttpStatusCodes.OK).json(WrapResponse.wrap(json, 'Sign in successful'));
    } else {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(WrapResponse.wrapErrorMessage('Invalid email or password'));
    }
  } catch (error: any) {
    console.error("❌ Error while signing in: ", error);
    return next(new APIError(error));
  }
}

/**
 * this is used to create account, However, the account will be initially set to a deactivated status,
 * and an email verification will be sent.
 * POST api/v1/auth/registerAccount
 * @param req
 * @param res
 */
export const RegisterAccount = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, isAdmin } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(WrapResponse.wrapErrorMessage('A user already exists with this email address'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isAdmin,
    });

    await getVerificationCode(email);
    return res.send(WrapResponse.wrapMessage('Verification code requested successfully'));
  } catch (error: any) {
    console.error("❌ Error while registering account: ", error);
    return next(new APIError(error));
  }
}

/**
 * this is used to send verification code to email address
 * POST api/v1/auth/sendVerificationEmail
 * @param req
 * @param res
 */
export const SendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('A user with this email address not exist'));
    }

    await getVerificationCode(email);
    return res.send(WrapResponse.wrapMessage('Verification code requested successfully'));
  } catch (error: any) {
    console.error("❌ Error while sending verification email: ", error);
    return next(new APIError(error));
  }
}

/**
 * this is used to verify the code through email.
 * it will activate account if it is verified after the register/login for unactivated user action (when === "auth")
 * or retrieve one-time token if it is verified after the forgotPassword action (when === "forgot")
 * POST api/v1/auth/verifyEmail
 * @param req
 * @param res
 */
export const VerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email, when, code } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('A user with this email address not exist'));
    }

    if (await verifyCode(email, code)) {
      if (when === "auth") {
        await activateUser(existingUser);
        const json = {
          user: existingUser,
          ...issueToken(existingUser.id, await getScope(existingUser))
        }
        return res.status(HttpStatusCodes.OK).json(WrapResponse.wrap(json, 'Create account successful'));
      } else {
        const json = issueToken(existingUser.id, "one-time");
        return res.status(HttpStatusCodes.OK).json(WrapResponse.wrap(json, 'Email has been verified'));
      }
    } else {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(WrapResponse.wrapErrorMessage('incorrect authentication code'));
    }
  } catch (error: any) {
    console.error("❌ Error while verifying email: ", error);
    return next(new APIError(error));
  }
}

/**
 * this is used to update the password following successful email verification
 * it will verify the bearer token (one-time) and proceed to update the password accordingly
 * POST api/v1/auth/updatePassword
 * @param req
 * @param res
 */
export const UpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(WrapResponse.wrapErrorMessage('A user with this email address not exist'));
    }

    await updatePassword(existingUser, password);
    const json = {
      user: existingUser,
      ...issueToken(existingUser.id, await getScope(existingUser))
    }
    return res.status(HttpStatusCodes.OK).json(WrapResponse.wrap(json, 'Password updated successfullyl'));
  } catch (error: any) {
    console.error("❌ Error while updating password: ", error);
    return next(new APIError(error));
  }
}

/**
 * GET api/v1/auth/deleteAccount
 * @param req
 * @param res
 */
export const DeleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.auth;

  try {
    await deleteUser(id);
    return res.status(HttpStatusCodes.OK).json(WrapResponse.wrapMessage('Deleted account successfully'));
  } catch (error: any) {
    console.error('❌ Error while deleting account:', error);
    return next(new APIError(error));
  }
}

/**
 * GET api/v1/auth/deleteAccount
 * @param req
 * @param res
 */
export const RefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = getToken(req);
  const { refreshToken: tokenRefresh } = req.body;

  if (!token || !tokenRefresh) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json(WrapResponse.wrapErrorMessage('No token attached'));
  }

  try {
    const tokenData = decode(token, {
      json: true
    });
    const refreshTokenData = jwt.verify(tokenRefresh, configJwt.jwtSecret) as jwt.JwtPayload;

    if (!(tokenData?.id === refreshTokenData.id && _.isEqual(tokenData?.scope, refreshTokenData.scope))) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(WrapResponse.wrapErrorMessage('Invalid token'));
    }

    // issue token again
    return res.status(HttpStatusCodes.OK).json({
      ...issueToken(tokenData?.id, await getScopeByUserId(tokenData?.id))
    });
  } catch (error: any) {
    console.error("❌ Error while refresh token: ", error);
    return next(new APIError(error));
  }
}


