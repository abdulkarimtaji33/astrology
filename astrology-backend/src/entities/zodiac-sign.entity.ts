import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('zodiac_signs')
export class ZodiacSign {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  element: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  modality: string | null;

  @Column({ name: 'ruled_by', type: 'int', nullable: true })
  ruledBy: number | null;
}
