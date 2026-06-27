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

// Resend API - https://resend.com/docs/api
async function sendViaResend(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  return await response.json();
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
  console.log("sendEmail called:", {
    user: smtpSettings?.user,
    passLength: smtpSettings?.pass?.length,
  });

  if (!smtpSettings?.user || !smtpSettings?.pass) {
    throw new Error("Email not configured. Please set your Resend API key and email in Settings.");
  }

  const fromEmail = smtpSettings.user;
  const apiKey = smtpSettings.pass; // Store Resend API key in SMTP password field
  const emailHtml = html || text || "";

  console.log("Sending email via Resend...");

  try {
    const result = await sendViaResend(apiKey, fromEmail, to, subject, emailHtml);
    console.log("Email sent successfully via Resend");
    return result;
  } catch (error: any) {
    console.error("Resend failed:", error.message);
    throw error;
  }
}
