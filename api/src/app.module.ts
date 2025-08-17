import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { UserAuthModule } from './modules/auth/user-auth/user-auth.module';
import { PartnerAuthModule } from './modules/auth/partner-auth/partner-auth.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [UsersModule, UserAuthModule, PartnerAuthModule],
})
export class AppModule {}
