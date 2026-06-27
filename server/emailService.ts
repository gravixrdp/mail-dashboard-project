import nodemailer from "nodemailer";

interface SmtpSettings {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export async function sendEmail(
  smtpSettings: SmtpSettings | null,
  {
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }
) {
  if (!smtpSettings?.user || !smtpSettings?.pass) {
    throw new Error("SMTP settings not configured. Please set your email and password in Settings.");
  }

  // Default to Gmail settings if host not provided
  const transporter = nodemailer.createTransport({
    host: smtpSettings.host || "smtp.gmail.com",
    port: smtpSettings.port || 587,
    secure: smtpSettings.secure ?? false,
    auth: {
      user: smtpSettings.user,
      pass: smtpSettings.pass,
    },
  });

  // Verify connection first
  await transporter.verify();

  const info = await transporter.sendMail({
    from: smtpSettings.user,
    to,
    subject,
    text,
    html,
  });

  return info;
}
