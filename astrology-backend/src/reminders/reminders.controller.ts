import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Get()
  findAll(@ReqUser() user: { id: number; email: string }) {
    return this.service.findAllForUser(user.id);
  }

  @Post()
  create(
    @Body() dto: CreateReminderDto,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.create(dto, user.id, user.email);
  }

  @Post('test-email')
  sendTest(@ReqUser() user: { id: number; email: string }) {
    return this.service.sendTestEmail(user.email);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReminderDto,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user: { id: number; email: string },
  ) {
    return this.service.remove(id, user.id);
  }
}
