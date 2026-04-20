import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { BirthRecordsService } from './birth-records.service';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';

@Controller('birth-records')
export class BirthRecordsController {
  constructor(private readonly service: BirthRecordsService) {}

  @Post()
  create(@Body() dto: CreateBirthRecordDto) {
    return this.service.create(dto);
  }

  @Get('planet-relationships')
  getPlanetRelationships() {
    return this.service.getPlanetRelationships();
  }

  @Get(':id/mahadasha')
  getMahadasha(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMahadasha(id);
  }

  @Get(':id/saturn-transits')
  getSaturnTransits(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSaturnTransits(id);
  }

  @Get(':id/chart')
  getChart(@Param('id', ParseIntPipe) id: number) {
    return this.service.getChart(id);
  }

  @Get(':id/moon-chart')
  getMoonChart(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMoonChart(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSummary(id);
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
  ) {
    return this.service.getTransits(id, from, to);
  }

  @Get(':id/ai-analysis')
  getAiAnalysis(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.service.getAiAnalysis(id, from, to, targetYear);
  }

  @Get(':id/ai-analyses')
  listAiAnalyses(@Param('id', ParseIntPipe) id: number) {
    return this.service.listAiAnalyses(id);
  }

  @Get(':id/ai-analyses/:analysisId')
  getAiAnalysisById(
    @Param('id', ParseIntPipe) id: number,
    @Param('analysisId', ParseIntPipe) analysisId: number,
  ) {
    return this.service.getAiAnalysisById(id, analysisId);
  }

  @Get(':id/house-ai')
  getHouseAi(
    @Param('id', ParseIntPipe) id: number,
    @Query('house') house: string,
    @Query('chart') chart?: string,
  ) {
    const h = parseInt(house, 10);
    if (Number.isNaN(h) || h < 1 || h > 12) {
      throw new BadRequestException('Query "house" must be an integer 1–12');
    }
    const kind = chart === 'moon' ? 'moon' : 'lagna';
    return this.service.getHouseAiAnalysis(id, h, kind);
  }
}
