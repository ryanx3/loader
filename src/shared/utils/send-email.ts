import fs from "fs";
import path from "path";
import { env } from "../../env";
import nodemailer from "nodemailer";

interface SendEmailProps {
  files?: string[];
  subject: string;
  html: string;
  to: string[];
}

export async function sendEmail({
  files = [],
  subject,
  to,
  html,
}: SendEmailProps) {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const attachments = files
      .filter((filePath) => fs.existsSync(filePath))
      .map((filePath) => ({
        filename: path.basename(filePath),
        content: fs.readFileSync(filePath),
      }));

    const mailOptions = {
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("❌ Falha ao enviar e-mail:", err);
  }
}
