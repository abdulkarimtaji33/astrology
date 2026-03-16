import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BirthRecord } from './birth-records/birth-record.entity';
import { BirthRecordsModule } from './birth-records/birth-records.module';
import { City } from './cities/city.entity';
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'astrology',
      entities: [BirthRecord, City],
      // Only sync the birth_records table; cities/geo tables are pre-populated via schema.sql
      synchronize: false,
      extra: {
        connectionLimit: 10,
        connectTimeout: 60000,
      },
    }),
    BirthRecordsModule,
    CitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
