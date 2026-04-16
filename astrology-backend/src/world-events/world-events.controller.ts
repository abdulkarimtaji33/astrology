import { Controller, Get, Query } from '@nestjs/common';
import { WorldEventsService } from './world-events.service';

@Controller('world-events')
export class WorldEventsController {
  constructor(private readonly service: WorldEventsService) {}

  @Get('predict')
  predict(@Query('from') from: string, @Query('to') to: string) {
    return this.service.predict(from, to);
  }
}
