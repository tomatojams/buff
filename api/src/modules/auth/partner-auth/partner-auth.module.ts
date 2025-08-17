import { Module } from '@nestjs/common';
import { PartnerAuthController } from './partner-auth.controller';
import { PartnerAuthService } from './partner-auth.service';

@Module({
  controllers: [PartnerAuthController],
  providers: [PartnerAuthService]
})
export class PartnerAuthModule {}
