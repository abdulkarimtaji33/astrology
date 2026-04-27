import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransitReminder } from './transit-reminder.entity';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransitReminder])],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
