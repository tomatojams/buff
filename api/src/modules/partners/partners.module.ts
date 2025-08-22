import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { DatabaseModule } from 'src/common/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
