import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'country_id', type: 'mediumint', unsigned: true })
  countryId: number;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode: string;

  @Column({ name: 'fips_code', type: 'varchar', length: 255, nullable: true })
  fipsCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  iso2: string | null;

  @Column({ name: 'iso3166_2', type: 'varchar', length: 10, nullable: true })
  iso3166_2: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  type: string | null;

  @Column({ type: 'int', nullable: true })
  level: number | null;

  @Column({ name: 'parent_id', type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  native: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  timezone: string | null;

  @Column({ type: 'text', nullable: true })
  translations: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'tinyint', name: 'flag', default: 1 })
  flag: number;

  @Column({ name: 'wikiDataId', type: 'varchar', length: 255, nullable: true })
  wikiDataId: string | null;

  @Column({ name: 'population', type: 'varchar', length: 255, nullable: true })
  population: string | null;
}
