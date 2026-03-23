import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { BirthRecordsService } from './birth-records.service';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';

@Controller('birth-records')
export class BirthRecordsController {
  constructor(private readonly service: BirthRecordsService) {}

  @Post()
  create(@Body() dto: CreateBirthRecordDto) {
    return this.service.create(dto);
  }

  @Get(':id/chart')
  getChart(@Param('id', ParseIntPipe) id: number) {
    return this.service.getChart(id);
  }

  @Get(':id/moon-chart')
  getMoonChart(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMoonChart(id);
  }

  @Get(':id/numerology')
  getNumerology(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.service.getNumerology(id, targetYear);
  }

  @Get(':id/transits')
  getTransits(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('basis') basis?: string,
  ) {
    const resolvedBasis: 'lagna' | 'moon' = basis === 'moon' ? 'moon' : 'lagna';
    return this.service.getTransits(id, from, to, resolvedBasis);
  }
}
