import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * Sends transactional email. When SMTP is not configured (typical in dev),
 * falls back to logging the message to the console so flows remain testable.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.email.smtpHost) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpPort === 465,
      auth: config.email.smtpUser
        ? { user: config.email.smtpUser, pass: config.email.smtpPass }
        : undefined,
    });
  }
  return transporter;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${html}\n`);
    return;
  }
  await tx.sendMail({ from: config.email.from, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${config.clientOrigin}/verify/${token}`;
  await sendMail(
    to,
    'Verify your BidStorm account',
    `<p>Welcome to BidStorm! Confirm your email to start bidding:</p>
     <p><a href="${link}">${link}</a></p>`,
  );
}
