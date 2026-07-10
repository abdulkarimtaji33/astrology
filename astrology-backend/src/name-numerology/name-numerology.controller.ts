import { Controller, Get, Query } from '@nestjs/common';
import { NameNumerologyService } from './name-numerology.service';

@Controller('name-numerology')
export class NameNumerologyController {
  constructor(private readonly service: NameNumerologyService) {}

  @Get('calculate')
  calculate(@Query('name') name: string) {
    return this.service.calculate(name);
  }

  @Get('domain-check')
  checkDomain(@Query('name') name: string) {
    return this.service.checkDomain(name);
  }
}
