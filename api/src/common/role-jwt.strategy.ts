// src/modules/auth/strategies/role-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../modules/users/users.service';
import { PartnersService } from '../modules/partners/partners.service';
import { jwtConstants } from './constants/constants';
import { Role } from 'src/modules/users/entity/user.entity';

@Injectable()
export class RoleJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly partnersService: PartnersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.secret,
    });
  }

  // payload에 { id, email, role } 이 들어온다고 가정
  async validate(payload: { id: string; email: string; role: Role }) {
    // role에 따라 user 테이블, partner 테이블 중 어디를 조회할지 분기
    if (payload.role === Role.USER || payload.role === Role.ADMIN) {
      const user = await this.usersService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      // user + role을 반환 (request.user에 저장)
      return { ...user, role: payload.role };
    } else if (payload.role === Role.PARTNER) {
      const partner = await this.partnersService.findById(payload.id);
      if (!partner) {
        throw new UnauthorizedException('Partner not found');
      }
      return { ...partner, role: payload.role };
    } else {
      // 이 외 예외처리
      throw new UnauthorizedException('Invalid role in JWT payload');
    }
  }
}
