import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { ORM_ENTITIES } from '../orm-entities';
import { AdminController } from './admin.controller';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([...ORM_ENTITIES, User])],
  controllers: [AdminController],
  providers: [AdminService, AdminKeyGuard, Reflector],
})
export class AdminModule {}
