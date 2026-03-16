import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthRecord } from './birth-record.entity';
import { BirthRecordsController } from './birth-records.controller';
import { BirthRecordsService } from './birth-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([BirthRecord])],
  controllers: [BirthRecordsController],
  providers: [BirthRecordsService],
})
export class BirthRecordsModule {}
