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
    throw new Error("Email not configured. Please set your email and API key in Settings.");
  }

  const fromEmail = smtpSettings.user;
  const apiKey = smtpSettings.pass;
  const emailHtml = html || text || "";

  console.log("Sending email via Resend API...");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend error:", response.status, error);
    throw new Error(`Email failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log("Email sent successfully!");
  return result;
}
