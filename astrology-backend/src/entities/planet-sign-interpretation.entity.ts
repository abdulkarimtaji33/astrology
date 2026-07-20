import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planet_sign_interpretations')
export class PlanetSignInterpretation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'planet_id', type: 'int' })
  planetId: number;

  @Column({ name: 'sign_id', type: 'int' })
  signId: number;

  @Column({ type: 'text' })
  interpretation: string;
}
