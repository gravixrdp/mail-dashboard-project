interface SmtpSettings {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

interface Attachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

// MailChannels API for Cloudflare Workers (free)
// https://api.mailchannels.net/tx/v1/documentation
async function sendViaMailChannels(
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string,
  text?: string
) {
  const response = await fetch("https://api.mailchannels.net/tx/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: toEmail }],
        },
      ],
      from: {
        email: fromEmail,
        name: "JobTracker Dashboard",
      },
      subject: subject,
      content: [
        {
          type: "text/plain",
          value: text || html.replace(/<[^>]*>/g, ""),
        },
        {
          type: "text/html",
          value: html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MailChannels API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// SMTP fallback using fetch-based approach (no DNS lookup needed)
async function sendViaSmtpFetch(
  smtpSettings: SmtpSettings,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string,
  text?: string
) {
  // For Gmail SMTP via fetch, we use a simple approach
  // In production, you'd use a service like Resend, SendGrid, or Postmark
  throw new Error(
    "SMTP not supported on Cloudflare Workers. Please use MailChannels (free) by setting your email in Settings."
  );
}

export async function sendEmail(
  smtpSettings: SmtpSettings | null,
  {
    to,
    subject,
    html,
    text,
    attachments = [],
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: Attachment[];
  }
) {
  console.log("sendEmail called with smtpSettings:", {
    user: smtpSettings?.user,
    host: smtpSettings?.host,
    port: smtpSettings?.port,
    secure: smtpSettings?.secure,
    passLength: smtpSettings?.pass?.length,
    attachmentsCount: attachments.length,
  });

  if (!smtpSettings?.user) {
    throw new Error("Email not configured. Please set your email in Settings.");
  }

  const fromEmail = smtpSettings.user;
  const emailHtml = html || text || "";
  const emailText = text || html?.replace(/<[^>]*>/g, "") || "";

  console.log("Sending email via MailChannels...");

  try {
    const result = await sendViaMailChannels(fromEmail, to, subject, emailHtml, emailText);
    console.log("Email sent successfully via MailChannels");
    return result;
  } catch (error: any) {
    console.error("MailChannels failed:", error.message);
    throw error;
  }
}
