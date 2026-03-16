import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
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
}
