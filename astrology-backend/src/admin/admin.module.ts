import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ORM_ENTITIES } from '../orm-entities';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature(ORM_ENTITIES)],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
