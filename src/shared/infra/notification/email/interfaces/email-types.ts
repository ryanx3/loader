export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
}

export interface EmailProps {
  attachments?: EmailAttachment[];
  subject: string;
  html: string;
  to: string[];
}
