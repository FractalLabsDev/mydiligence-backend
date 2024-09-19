import * as Joi from "joi";
import { getEnvironment } from "../utils/env";

const customJoi = Joi.extend(joi => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'email.invalid': "{{#label}} must be a valid email",
    'email.prodEmail': "{{#label}} should not contain the character '+' for the non-fractallabs.dev domain",
  },
  rules: {
    emailCheck: {
      validate(value, helpers) {
        if (!value.includes('@')) {
          return helpers.error('email.invalid', { value });
        }

        const parts = value.split('@');
        const localPart = parts[0];
        const domainPart = parts[1];

        if (getEnvironment() === 'prod' && domainPart !== "fractallabs.dev" && localPart.includes('+')) {
          return helpers.error('email.prodEmail', { value });
        }

        if (!domainPart.includes('.')) {
          return helpers.error('email.invalid', { value });
        }

        return value;
      }
    }
  }
}));

const baseSchema = {
  email: customJoi.string().emailCheck().required(),
}

export const enterEmailSchema = Joi.object({
  ...baseSchema
});

export const sendVerificationEmailSchema = Joi.object({
  ...baseSchema
});

export const verifyEmailSchema = Joi.object({
  ...baseSchema,
  when: Joi.string().valid("auth", "forgot").default("auth"),
  code: Joi.string().required()
});

export const signInSchema = Joi.object({
  ...baseSchema,
  password: Joi.string().required(),
})

export const signupSchema = Joi.object({
  ...baseSchema,
  password: Joi.string().required(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  isAdmin: Joi.boolean().default(false)
});

export const updatePasswordSchema = Joi.object({
  ...baseSchema,
  password: Joi.string().required(),
});
