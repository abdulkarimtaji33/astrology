import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('planets')
export class Planet {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ name: 'sanskrit_name', type: 'varchar', length: 50, nullable: true })
  sanskritName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  type: string | null;
}
