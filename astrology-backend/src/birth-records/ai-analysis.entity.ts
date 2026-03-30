import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ai_analyses')
export class AiAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'birth_record_id' })
  birthRecordId: number;

  @Column({ name: 'transit_from', length: 10 })
  transitFrom: string;

  @Column({ name: 'transit_to', length: 10 })
  transitTo: string;

  @Column({ length: 10 })
  basis: string;

  @Column({ length: 50 })
  model: string;

  @Column({ type: 'longtext' })
  prompt: string;

  @Column({ type: 'longtext' })
  response: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
