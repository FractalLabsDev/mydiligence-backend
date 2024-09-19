import sgMail from '@sendgrid/mail';
import { getUsersByIds } from '../internal/user.service';

const sgApiKey = process.env.SENDGRID_API_KEY;
const sgUnsubscribeGroupId = process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID
  ;

if (!sgApiKey) {
  throw new Error('Sendgrid API key not configured');
}

export async function sendEmail(
  userIds: string[],
  subject: string,
  html: string,
  from = "mydiligence@fractallabs.dev"
) {
  try {
    const emailFooter = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tbody>
          <tr>
            <td align="center" width="100%" style="color:#65735b;font-size:12px;line-height:24px;padding-bottom:30px;padding-top:30px">
              <a href="<%asm_group_unsubscribe_raw_url%>" style="color:#65735b;text-decoration:underline" target="_blank">
                Unsubscribe
              </a> &nbsp; | &nbsp;
              <a href="<%asm_preferences_raw_url%>" style="color:#65735b;text-decoration:underline" target="_blank">Email Preferences</a>
              <div style="font-family:Helvetica,Arial,sans-serif;word-break:normal">
                4438 Ingraham St., San Diego, CA 92109
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `;
    sgMail.setApiKey(sgApiKey!);
    const users = await getUsersByIds(userIds);
    sgMail.setSubstitutionWrappers("{{", "}}");
    const msg: sgMail.MailDataRequired = {
      from,
      subject,
      content: [{
        type: 'text/html',
        value: `
          ${html}
        `
      }],
      personalizations: users.map(user => ({
        to: [{ email: user.email }],
        substitutions: {
          "firstName": user.firstName || "",
          "footer": emailFooter
        }
      }))
    };
    if (sgUnsubscribeGroupId) {
      msg.asm = {
        groupId: parseInt(sgUnsubscribeGroupId)
      }
    }

    // Send the email with multiple personalizations
    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
}
