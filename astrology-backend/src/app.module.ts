import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BirthRecordsModule } from './birth-records/birth-records.module';
import { CitiesModule } from './cities/cities.module';
import { WorldEventsModule } from './world-events/world-events.module';
import { ORM_ENTITIES } from './orm-entities';
import { AdminModule } from './admin/admin.module';
import { RemindersModule } from './reminders/reminders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'astrology',
      entities: ORM_ENTITIES,
      // Only sync the birth_records table; cities/geo tables are pre-populated via schema.sql
      synchronize: false,
      extra: {
        connectionLimit: 10,
        connectTimeout: 600000, // 
      },
    }),
    AuthModule,
    BirthRecordsModule,
    CitiesModule,
    WorldEventsModule,
    AdminModule,
    RemindersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
