import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthRecord } from './birth-record.entity';
import { AiAnalysis } from './ai-analysis.entity';
import { PlanetaryAvastha } from '../entities/planetary-avastha.entity';
import { BirthRecordsController } from './birth-records.controller';
import { BirthRecordsService } from './birth-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([BirthRecord, AiAnalysis, PlanetaryAvastha])],
  controllers: [BirthRecordsController],
  providers: [BirthRecordsService],
})
export class BirthRecordsModule {}
