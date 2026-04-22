import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('planetary_avastha')
export class PlanetaryAvastha {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ name: 'english_name', type: 'varchar', length: 50, nullable: true })
  englishName: string | null;

  @Column({ name: 'degree_from', type: 'decimal', precision: 4, scale: 1, nullable: true })
  degreeFrom: string | null;

  @Column({ name: 'degree_to', type: 'decimal', precision: 4, scale: 1, nullable: true })
  degreeTo: string | null;

  @Column({ name: 'effect_percent', type: 'int', nullable: true })
  effectPercent: number | null;
}
