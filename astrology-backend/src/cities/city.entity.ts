import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'state_code', length: 255 })
  stateCode: string;

  @Column({ name: 'country_code', length: 2 })
  countryCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ length: 255, nullable: true })
  timezone: string;
}
