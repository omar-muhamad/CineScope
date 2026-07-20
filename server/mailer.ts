import nodemailer from "nodemailer";

import { env } from "./env";

/**
 * Auth email transport. With SMTP_HOST configured, mail goes out via
 * Nodemailer; without it (typical local dev), the emailed link is logged
 * to the terminal instead so the flows stay testable end-to-end.
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

/**
 * The passwordless sign-in email. Better Auth hands us the fully-formed
 * verify URL (pointing at `${baseURL}/api/auth/magic-link/verify?...`) —
 * unlike the old custom senders there is no link-building here. Expiry copy
 * must match the magicLink plugin's `expiresIn` in server/auth.ts.
 */
export const sendMagicLinkEmail = async (
  to: string,
  url: string,
): Promise<void> => {
  if (!transport) {
    console.info(
      `[mailer] SMTP not configured — magic link for ${to}:\n${url}`,
    );
    return;
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Your CineScope sign-in link",
    text: `Sign in to CineScope by opening this link:\n${url}\n\nThe link expires in 10 minutes and signs you in on the device that opens it. If you didn't request it, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Sign in to CineScope</h2>
        <p>Click below to sign in — no password needed.</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background:#fc4747;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
            Sign in to CineScope
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          The link expires in 10 minutes and signs you in on the device that
          opens it. If you didn't request it, you can ignore this email.
        </p>
      </div>
    `,
  });
};

/**
 * Approval email for an email-address change. Better Auth sends this to the
 * account's CURRENT address (the one that can prove ownership); the change
 * only applies once the link is opened.
 */
export const sendChangeEmailVerificationEmail = async (
  to: string,
  newEmail: string,
  url: string,
): Promise<void> => {
  if (!transport) {
    console.info(
      `[mailer] SMTP not configured — change-email approval for ${to} (new address: ${newEmail}):\n${url}`,
    );
    return;
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Confirm your CineScope email change",
    text: `We received a request to change your CineScope email to ${newEmail}.\n\nConfirm the change by opening this link:\n${url}\n\nIf you didn't request this, ignore this email — your address stays unchanged.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Confirm your email change</h2>
        <p>We received a request to change your CineScope email to <strong>${newEmail}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background:#fc4747;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
            Confirm email change
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          If you didn't request this, ignore this email — your address stays
          unchanged.
        </p>
      </div>
    `,
  });
};

/**
 * Generic address-verification email — used by Better Auth when a (changed)
 * address needs to be re-verified.
 */
export const sendVerificationEmail = async (
  to: string,
  url: string,
): Promise<void> => {
  if (!transport) {
    console.info(
      `[mailer] SMTP not configured — verification link for ${to}:\n${url}`,
    );
    return;
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Verify your CineScope email",
    text: `Confirm this email address for your CineScope account by opening this link:\n${url}\n\nIf this wasn't you, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Confirm this email address for your CineScope account.</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background:#fc4747;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
            Verify email
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          If this wasn't you, you can ignore this email.
        </p>
      </div>
    `,
  });
};
