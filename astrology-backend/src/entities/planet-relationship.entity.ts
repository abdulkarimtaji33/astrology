import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('planet_relationships')
export class PlanetRelationship {
  @PrimaryColumn({ name: 'planet_id', type: 'int' })
  planetId: number;

  @PrimaryColumn({ name: 'related_planet_id', type: 'int' })
  relatedPlanetId: number;

  @Column({ name: 'is_friendly', type: 'int', nullable: true })
  isFriendly: number | null;
}
