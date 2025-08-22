import { Module } from '@nestjs/common';
import { PartnerAuthController } from './partner-auth.controller';
import { PartnerAuthService } from './partner-auth.service';
import { RedisService } from 'src/common/redis.service';
import { S3Service } from 'src/common/s3.service';
import { DatabaseModule } from 'src/common/database.module';
import { PartnersModule } from 'src/modules/partners/partners.module';

@Module({
  imports: [DatabaseModule, PartnersModule],
  controllers: [PartnerAuthController],
  providers: [PartnerAuthService, RedisService, S3Service],
})
export class PartnerAuthModule {}
