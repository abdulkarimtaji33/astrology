import { Module } from '@nestjs/common';
import { NameNumerologyController } from './name-numerology.controller';
import { NameNumerologyService } from './name-numerology.service';

@Module({
  controllers: [NameNumerologyController],
  providers: [NameNumerologyService],
})
export class NameNumerologyModule {}
