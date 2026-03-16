import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('birth_records')
export class BirthRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'time' })
  birthTime: string;

  @Column({ length: 255, nullable: true })
  cityName: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ length: 255, nullable: true })
  timezone: string;

  @CreateDateColumn()
  createdAt: Date;
}
