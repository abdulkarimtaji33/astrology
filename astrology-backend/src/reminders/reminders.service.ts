import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { TransitReminder } from './transit-reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(
    @InjectRepository(TransitReminder)
    private readonly repo: Repository<TransitReminder>,
  ) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = parseInt(SMTP_PORT ?? '587', 10);
      const secureExplicit = SMTP_SECURE === '1' || SMTP_SECURE === 'true';
      const insecureExplicit = SMTP_SECURE === '0' || SMTP_SECURE === 'false';
      const secure = insecureExplicit ? false : secureExplicit || port === 465;
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        requireTLS: !secure && port === 587,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
      this.logger.warn('SMTP env vars not set — emails will be skipped.');
      this.transporter = null;
    }
  }

  create(dto: CreateReminderDto) {
    const reminder = this.repo.create({
      recipientEmail: dto.recipientEmail,
      sendDate: dto.sendDate,
      subject: dto.subject,
      placementDetails: dto.placementDetails,
      note: dto.note ?? null,
      status: 'pending',
    });
    return this.repo.save(reminder);
  }

  findAll() {
    return this.repo.find({ order: { sendDate: 'ASC' } });
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }

  /** Runs daily at 08:00 UTC — sends any pending reminders whose sendDate <= today */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processPending() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const due = await this.repo.find({
      where: { status: 'pending', sendDate: LessThanOrEqual(todayStr) as any },
    });
    for (const reminder of due) {
      await this.sendEmail(reminder);
    }
    if (due.length > 0) {
      this.logger.log(`Processed ${due.length} reminder(s)`);
    }
  }

  private async sendEmail(reminder: TransitReminder) {
    if (!this.transporter) {
      this.logger.warn(`Skipping email id=${reminder.id} — no SMTP config`);
      await this.repo.update(reminder.id, { status: 'failed' });
      return;
    }
    const body = [
      reminder.note ? `Note: ${reminder.note}\n\n` : '',
      reminder.placementDetails,
    ].join('');

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: reminder.recipientEmail,
        subject: reminder.subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });
      await this.repo.update(reminder.id, { status: 'sent' });
      this.logger.log(`Sent reminder id=${reminder.id} to ${reminder.recipientEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send reminder id=${reminder.id}`, err);
      await this.repo.update(reminder.id, { status: 'failed' });
    }
  }
}
