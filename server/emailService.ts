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
  console.log("sendEmail called with smtpSettings:", {
    user: smtpSettings?.user,
    host: smtpSettings?.host,
    port: smtpSettings?.port,
    secure: smtpSettings?.secure,
    passLength: smtpSettings?.pass?.length,
  });

  if (!smtpSettings?.user || !smtpSettings?.pass) {
    throw new Error("SMTP settings not configured. Please set your email and password in Settings.");
  }

  // Default to Gmail settings if host not provided
  const transporterConfig = {
    host: smtpSettings.host || "smtp.gmail.com",
    port: smtpSettings.port || 587,
    secure: smtpSettings.secure ?? false,
    auth: {
      user: smtpSettings.user,
      pass: smtpSettings.pass,
    },
  };

  console.log("Transporter config:", {
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    authUser: transporterConfig.auth.user,
  });

  const transporter = nodemailer.createTransport(transporterConfig);

  // Verify connection first
  console.log("Verifying transporter...");
  await transporter.verify();
  console.log("Transporter verified!");

  const info = await transporter.sendMail({
    from: smtpSettings.user,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent successfully, messageId:", info.messageId);
  return info;
}
