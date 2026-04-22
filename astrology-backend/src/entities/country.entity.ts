import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'char', length: 3, nullable: true })
  iso3: string | null;

  @Column({ name: 'numeric_code', type: 'char', length: 3, nullable: true })
  numericCode: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  iso2: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phonecode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  capital: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currency: string | null;

  @Column({ name: 'currency_name', type: 'varchar', length: 255, nullable: true })
  currencyName: string | null;

  @Column({ name: 'currency_symbol', type: 'varchar', length: 255, nullable: true })
  currencySymbol: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tld: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  native: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  population: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  gdp: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  region: string | null;

  @Column({ name: 'region_id', type: 'mediumint', unsigned: true, nullable: true })
  regionId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subregion: string | null;

  @Column({ name: 'subregion_id', type: 'mediumint', unsigned: true, nullable: true })
  subregionId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nationality: string | null;

  @Column({ name: 'area_sq_km', type: 'double', nullable: true })
  areaSqKm: number | null;

  @Column({ name: 'postal_code_format', type: 'varchar', length: 255, nullable: true })
  postalCodeFormat: string | null;

  @Column({ name: 'postal_code_regex', type: 'varchar', length: 255, nullable: true })
  postalCodeRegex: string | null;

  @Column({ type: 'text', nullable: true })
  timezones: string | null;

  @Column({ type: 'text', nullable: true })
  translations: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  emoji: string | null;

  @Column({ name: 'emojiU', type: 'varchar', length: 191, nullable: true })
  emojiU: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'tinyint', name: 'flag', default: 1 })
  flag: number;

  @Column({ name: 'wikiDataId', type: 'varchar', length: 255, nullable: true })
  wikiDataId: string | null;
}
