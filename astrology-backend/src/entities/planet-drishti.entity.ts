import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planet_drishti')
export class PlanetDrishti {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'planet_id', type: 'int' })
  planetId: number;

  @Column({ name: 'occupant_house_id', type: 'int' })
  occupantHouseId: number;

  @Column({ name: 'aspected_house_id', type: 'int' })
  aspectedHouseId: number;

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder: number;
}
