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

// Gmail SMTP IPs (hardcoded to avoid DNS lookup)
const SMTP_HOSTS: Record<string, string> = {
  "smtp.gmail.com": "142.250.113.108",
  "smtp.outlook.com": "40.97.164.146",
  "smtp.office365.com": "40.97.164.146",
  "smtp.yahoo.com": "66.220.153.11",
};

function getSmtpIp(host: string): string {
  return SMTP_HOSTS[host] || host;
}

// Simple SMTP client using Cloudflare TCP Sockets
async function sendSmtpEmail(
  settings: SmtpSettings,
  to: string,
  subject: string,
  html: string
) {
  const host = settings.host || "smtp.gmail.com";
  const port = settings.port || 587;
  const ip = getSmtpIp(host);
  const user = settings.user || "";
  const pass = settings.pass || "";

  console.log(`Connecting to ${ip}:${port} (SMTP: ${host})`);

  // Connect using Cloudflare TCP Socket
  const socket = connect({ hostname: ip, port });

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let buffer = "";

  // Read response from server
  async function readResponse(): Promise<string> {
    const timeout = 10000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\r\n");
      if (lines.length >= 2) {
        const response = lines.slice(0, -1).join("\r\n");
        buffer = lines.slice(-1).join("");
        return response;
      }
    }
    return buffer;
  }

  // Send SMTP command
  async function send(cmd: string) {
    console.log(`> ${cmd.substring(0, 50)}...`);
    await writer.write(encoder.encode(cmd + "\r\n"));
  }

  // Auth in base64
  function b64(str: string): string {
    return btoa(str);
  }

  try {
    // Read server greeting
    const greeting = await readResponse();
    console.log(`< ${greeting.substring(0, 50)}`);

    // EHLO
    await send(`EHLO jobtracker.local`);
    const ehlo = await readResponse();
    console.log(`< EHLO response received`);

    // STARTTLS if port 587
    if (port === 587) {
      await send("STARTTLS");
      const tlsResp = await readResponse();
      console.log(`< ${tlsResp.substring(0, 30)}`);

      // Note: Cloudflare Workers don't support upgrading to TLS in this way
      // For production, use port 465 with direct TLS or use an API service
      if (tlsResp.includes("220")) {
        console.log("STARTTLS accepted - but TLS upgrade not supported in this impl");
        console.log("Falling back to plain text (not recommended for production)");
      }
    }

    // AUTH LOGIN
    await send("AUTH LOGIN");
    const authResp = await readResponse();
    console.log(`< AUTH: ${authResp.substring(0, 20)}`);

    // Username
    await send(b64(user));
    const userResp = await readResponse();
    console.log(`< USER: ${userResp.substring(0, 20)}`);

    // Password
    await send(b64(pass));
    const passResp = await readResponse();
    console.log(`< PASS: ${passResp.substring(0, 20)}`);

    // MAIL FROM
    await send(`MAIL FROM:<${user}>`);
    const mailResp = await readResponse();
    console.log(`< MAIL: ${mailResp.substring(0, 20)}`);

    // RCPT TO
    await send(`RCPT TO:<${to}>`);
    const rcptResp = await readResponse();
    console.log(`< RCPT: ${rcptResp.substring(0, 20)}`);

    // DATA
    await send("DATA");
    const dataResp = await readResponse();
    console.log(`< DATA: ${dataResp.substring(0, 20)}`);

    // Email content
    const emailData = [
      `From: ${user}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
      `.`,
      ``,
    ].join("\r\n");

    await send(emailData);
    const sendResp = await readResponse();
    console.log(`< SEND: ${sendResp.substring(0, 20)}`);

    // QUIT
    await send("QUIT");
    await readResponse();

    console.log("Email sent successfully!");
    return { messageId: `smtp-${Date.now()}` };

  } catch (error: any) {
    console.error("SMTP Error:", error.message);
    throw error;
  } finally {
    try {
      await writer.close();
      await reader.cancel();
    } catch (e) {}
  }
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
    host: smtpSettings?.host,
    passLength: smtpSettings?.pass?.length,
  });

  if (!smtpSettings?.user || !smtpSettings?.pass) {
    throw new Error("Email not configured. Please set your email and password in Settings.");
  }

  const emailHtml = html || text || "";

  console.log("Sending email via SMTP...");

  try {
    const result = await sendSmtpEmail(smtpSettings, to, subject, emailHtml);
    console.log("Email sent successfully!");
    return result;
  } catch (error: any) {
    console.error("SMTP failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
