import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subregions')
export class Subregion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  translations: string | null;

  @Column({ name: 'region_id', type: 'int' })
  regionId: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'tinyint', name: 'flag', default: 1 })
  flag: number;

  @Column({ name: 'wikiDataId', type: 'varchar', length: 255, nullable: true })
  wikiDataId: string | null;
}
