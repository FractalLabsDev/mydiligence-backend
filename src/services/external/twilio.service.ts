import { Twilio } from 'twilio';

import twilioConfig from '@/config/twilio';
import { getEnvironment } from '../../utils/env';

const client = new Twilio(twilioConfig.accountSid, twilioConfig.authToken, {
  lazyLoading: true,
});

/**
 * Get Verification code from Twilio
 * @param  {string}                 email Email address
 * @return {Promise<void>}          Empty promise
 */
export const getVerificationCode = async (email: string): Promise<void> => {
  if (twilioConfig.twilioServiceId) {
    await client.verify.v2.services(twilioConfig.twilioServiceId)
      .verifications
      .create({
        channelConfiguration: {
          from_name: 'MyDiligence'
        },
        to: email,
        channel: 'email'
      });
  } else {
    throw new Error(`❌ Verfication service not created`);
  }
}

/**
 * Verify Twilio code
 * @param  {string}                 email Email address
 * @param  {string}                 code Auth code
 * @return {Promise<boolean>}       Returns true if code is correct
 */
export const verifyCode = async (email: string, code: string): Promise<boolean> => {
  if (!twilioConfig?.twilioServiceId && getEnvironment() !== "local") {
    throw new Error(`❌ Verfication service not created`);
  }

  try {
    const verification = await client.verify.v2.services(twilioConfig.twilioServiceId)
      .verificationChecks.create({ to: email, code });
    return verification.status === 'approved';
  } catch (err) {
    console.error('❌ Error verifying twilio code', err);
    throw err;
  }
}
