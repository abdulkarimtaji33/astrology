import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('houses')
export class House {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ name: 'main_theme', type: 'varchar', length: 100, nullable: true })
  mainTheme: string | null;

  @Column({ type: 'text', nullable: true })
  represents: string | null;
}
