import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planet_house_interpretations')
export class PlanetHouseInterpretation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'planet_id', type: 'int' })
  planetId: number;

  @Column({ name: 'house_id', type: 'int' })
  houseId: number;

  @Column({ type: 'text' })
  interpretation: string;
}
