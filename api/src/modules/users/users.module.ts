import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/common/database.module';
import { RedisService } from 'src/common/redis.service';

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [UsersService, RedisService],
  controllers: [UsersController],
})
export class UsersModule {}
