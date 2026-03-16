import { Controller, Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Get('search')
  search(@Query('q') q: string, @Query('limit') limit = '10') {
    return this.service.search(q, parseInt(limit, 10));
  }
}
