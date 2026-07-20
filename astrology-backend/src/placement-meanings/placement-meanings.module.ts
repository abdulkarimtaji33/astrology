import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanetHouseInterpretation } from '../entities/planet-house-interpretation.entity';
import { PlanetSignInterpretation } from '../entities/planet-sign-interpretation.entity';
import { PlacementMeaningsController } from './placement-meanings.controller';
import { PlacementMeaningsService } from './placement-meanings.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanetHouseInterpretation, PlanetSignInterpretation])],
  controllers: [PlacementMeaningsController],
  providers: [PlacementMeaningsService],
})
export class PlacementMeaningsModule {}
