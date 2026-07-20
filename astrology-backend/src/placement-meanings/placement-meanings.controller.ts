import { Controller, Get, Query } from '@nestjs/common';
import { PlacementMeaningsService } from './placement-meanings.service';

@Controller('placement-meanings')
export class PlacementMeaningsController {
  constructor(private readonly service: PlacementMeaningsService) {}

  @Get()
  getMeaning(
    @Query('planet') planet: string,
    @Query('house') house: string | undefined,
    @Query('sign') sign: string | undefined,
  ) {
    return this.service.getMeaning(planet, house, sign);
  }
}
