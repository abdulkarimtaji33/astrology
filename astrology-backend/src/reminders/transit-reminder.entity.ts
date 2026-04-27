import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transit_reminders')
export class TransitReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientEmail: string;

  /** ISO date string: when to send the email (YYYY-MM-DD) */
  @Column({ type: 'date' })
  sendDate: string;

  @Column({ length: 500 })
  subject: string;

  /** The transit placement description (pre-formatted text) */
  @Column({ type: 'text' })
  placementDetails: string;

  /** Optional extra note from the user */
  @Column({ type: 'text', nullable: true })
  note: string | null;

  /** 'pending' | 'sent' | 'failed' */
  @Column({ default: 'pending', length: 20 })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
