import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = parseInt(SMTP_PORT ?? '587', 10);
      const explicitOff = SMTP_SECURE === '0' || SMTP_SECURE === 'false';
      const secure = explicitOff ? false : SMTP_SECURE === '1' || SMTP_SECURE === 'true' || port === 465;
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        requireTLS: !secure && port === 587,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
      this.transporter = null;
    }
  }

  /** Returns false (and logs) when SMTP is not configured; never throws to callers. */
  async send(to: string, subject: string, text: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`SMTP not configured — email to ${to} skipped. Subject: ${subject}\n${text}`);
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (e) {
      this.logger.error(`Failed to send email to ${to}: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }
}
