import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BirthRecordsService } from './birth-records.service';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { ReqUser } from '../auth/req-user.decorator';

@Controller('birth-records')
@UseGuards(JwtAuthGuard)
export class BirthRecordsController {
  constructor(private readonly service: BirthRecordsService) {}

  /** Reference data — no auth */
  @Public()
  @Get('planet-relationships')
  getPlanetRelationships() {
    return this.service.getPlanetRelationships();
  }

  @Get('mine')
  listMine(@ReqUser() user: { id: number; email: string }) {
    return this.service.listMine(user.id);
  }

  @Post()
  create(
    @Body() dto: CreateBirthRecordDto,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.create(dto, user.id);
  }

  @Get(':id/mahadasha')
  getMahadasha(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getMahadasha(id, user.id);
  }

  @Get(':id/saturn-transits')
  getSaturnTransits(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getSaturnTransits(id, user.id);
  }

  @Get(':id/chart')
  getChart(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getChart(id, user.id);
  }

  @Get(':id/moon-chart')
  getMoonChart(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getMoonChart(id, user.id);
  }

  @Get(':id/summary')
  getSummary(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getSummary(id, user.id);
  }

  @Get(':id/numerology')
  getNumerology(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: string | undefined,
    @ReqUser() user: { id: number; email: string },
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.service.getNumerology(id, user.id, targetYear);
  }

  @Get(':id/transits')
  getTransits(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('basis') basis: string | undefined,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getTransits(id, from, to, user.id, basis === 'moon' ? 'moon' : 'lagna');
  }

  @Get(':id/ai-analysis')
  getAiAnalysis(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('year') year: string | undefined,
    @Query('basis') basis: string | undefined,
    @ReqUser() user: { id: number; email: string },
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;
    return this.service.getAiAnalysis(id, from, to, user.id, targetYear, basis === 'moon' ? 'moon' : 'lagna');
  }

  @Get(':id/ai-analyses')
  listAiAnalyses(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.listAiAnalyses(id, user.id);
  }

  @Get(':id/ai-analyses/:analysisId')
  getAiAnalysisById(
    @Param('id', ParseIntPipe) id: number,
    @Param('analysisId', ParseIntPipe) analysisId: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.getAiAnalysisById(id, analysisId, user.id);
  }

  @Get(':id/house-ai')
  getHouseAi(
    @Param('id', ParseIntPipe) id: number,
    @Query('house') house: string,
    @Query('chart') chart: string | undefined,
    @ReqUser() user: { id: number; email: string },
  ) {
    const h = parseInt(house, 10);
    if (Number.isNaN(h) || h < 1 || h > 12) {
      throw new BadRequestException('Query "house" must be an integer 1–12');
    }
    const kind = chart === 'moon' ? 'moon' : 'lagna';
    return this.service.getHouseAiAnalysis(id, h, kind, user.id);
  }
}
