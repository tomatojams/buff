import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Knex } from 'knex';
import { UserModel } from 'src/modules/users/entity/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly redisService: RedisService,
  ) {}

  async findById(id: string): Promise<Omit<UserModel, 'password'>> {
    return this.knex('user')
      .select(
        'id',
        'email',
        'socialProvider',
        'socialId',
        'phone',
        'points',
        'pushNotificationEnabled',
        'role',
        'createdAt',
        'updatedAt',
      )
      .where('id', id)
      .andWhere('revoked_at', null)
      .first();
  }
}
