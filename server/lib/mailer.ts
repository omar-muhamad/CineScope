import nodemailer from "nodemailer";

import { env } from "../env";

/**
 * Verification email transport. With SMTP_HOST configured, mail goes out via
 * Nodemailer; without it (typical local dev), the verification link is logged
 * to the server console instead so the flow stays testable end-to-end.
 */
const transport = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      // Port 465 is implicit TLS; 587/25 upgrade via STARTTLS.
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    })
  : null;

export const sendVerificationEmail = async (
  to: string,
  token: string,
): Promise<void> => {
  const link = `${env.appOrigin}/verify-email?token=${token}`;

  if (!transport) {
    console.info(
      `[mailer] SMTP not configured — verification link for ${to}:\n${link}`,
    );
    return;
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Verify your CineScope email",
    text: `Welcome to CineScope!\n\nConfirm your email address by opening this link:\n${link}\n\nThe link expires in ${env.verificationTokenTtlHours} hours. If you didn't create a CineScope account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to CineScope!</h2>
        <p>Confirm your email address to start saving favorites and building your watch-later list.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#fc4747;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
            Verify email
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          The link expires in ${env.verificationTokenTtlHours} hours.
          If you didn't create a CineScope account, you can ignore this email.
        </p>
      </div>
    `,
  });
};
