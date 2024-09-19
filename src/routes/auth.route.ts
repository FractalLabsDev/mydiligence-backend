import validator from '@/lib/validator';
import { Router } from 'express';

import {
  DeleteAccount,
  EnterEmail,
  RefreshToken,
  RegisterAccount,
  SendVerificationEmail,
  SignIn,
  UpdatePassword,
  VerifyEmail
} from "@/controllers/auth.controller";
import {
  enterEmailSchema,
  sendVerificationEmailSchema,
  signInSchema,
  signupSchema,
  updatePasswordSchema,
  verifyEmailSchema
} from '@/validation/auth.validation';
import { checkJwt, checkRole } from '../middlewares/token-guard';

const router = Router();

router.post('/enterEmail', validator.body(enterEmailSchema), EnterEmail);
router.post('/signIn', validator.body(signInSchema), SignIn);
router.post('/registerAccount', validator.body(signupSchema), RegisterAccount);
router.post('/sendVerificationEmail', validator.body(sendVerificationEmailSchema), SendVerificationEmail);
router.post('/verifyEmail', validator.body(verifyEmailSchema), VerifyEmail);
router.post('/updatePassword', checkJwt(), checkRole(['user', 'one-time']), validator.body(updatePasswordSchema), UpdatePassword);
router.get('/deleteAccount', checkJwt(), checkRole(['user']), DeleteAccount);

router.post('/refreshToken', RefreshToken);

export default router;
