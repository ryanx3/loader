import fs from "fs";
import nodemailer from "nodemailer";
import { env } from "process";
import { INotification } from "../interfaces/notification.types";
import { EmailProps } from "./interfaces/email-types";

export class EmailChannel implements INotification<EmailProps> {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  async send({
    attachments = [],
    subject,
    to,
    html,
  }: EmailProps): Promise<void> {
    const resolvedAttachments = attachments.map((att) => ({
      filename: att.filename,
      content:
        typeof att.content === "string"
          ? fs.readFileSync(att.content)
          : att.content,
    }));

    await this.transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments: resolvedAttachments,
    });
  }
}
