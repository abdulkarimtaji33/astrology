import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { TransitReminder } from './transit-reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

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

  private get fromAddr() {
    return process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
  }

  create(dto: CreateReminderDto, userId: number, userEmail: string) {
    const recipientEmail = (dto.recipientEmail?.trim() || userEmail).toLowerCase();
    const reminder = this.repo.create({
      userId,
      recipientEmail,
      sendDate: dto.sendDate,
      subject: dto.subject,
      placementDetails: dto.placementDetails,
      note: dto.note ?? null,
      status: 'pending',
    });
    return this.repo.save(reminder);
  }

  findAllForUser(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { sendDate: 'ASC', id: 'ASC' },
    });
  }

  async update(id: number, userId: number, dto: UpdateReminderDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row || row.userId !== userId) throw new NotFoundException('Reminder not found');
    if (row.status === 'sent') throw new BadRequestException('Cannot edit a reminder that was already sent');
    if (dto.recipientEmail !== undefined) row.recipientEmail = dto.recipientEmail.trim().toLowerCase();
    if (dto.sendDate !== undefined) row.sendDate = dto.sendDate;
    if (dto.subject !== undefined) row.subject = dto.subject;
    if (dto.placementDetails !== undefined) row.placementDetails = dto.placementDetails;
    if (dto.note !== undefined) row.note = dto.note ?? null;
    return this.repo.save(row);
  }

  async remove(id: number, userId: number) {
    const res = await this.repo.delete({ id, userId });
    if (!res.affected) throw new NotFoundException('Reminder not found');
    return { ok: true };
  }

  async sendTestEmail(userEmail: string) {
    if (!this.transporter) {
      throw new BadRequestException('Email (SMTP) is not configured on the server');
    }
    const body =
      'This is a test message from your Astrology app.\n\nIf you see this, reminder emails are configured correctly.';
    await this.transporter.sendMail({
      from: this.fromAddr,
      to: userEmail,
      subject: 'Test: transit reminder',
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });
    this.logger.log(`sendTestEmail: sent to ${userEmail}`);
    return { ok: true, message: 'Check your inbox (and spam).' };
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
        from: this.fromAddr,
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
