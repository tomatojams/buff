import { Module } from '@nestjs/common';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/common/database.module';
import { UsersModule } from 'src/modules/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/common/constants/constants';
import { RedisService } from 'src/common/redis.service';

@Module({
  imports: [
    HttpModule,

    DatabaseModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, RedisService],
})
export class UserAuthModule {}
