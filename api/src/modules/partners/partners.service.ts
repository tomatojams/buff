import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class PartnersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findById(id: string): Promise<any> {
    const partner = await this.knex('partner')
      .select(
        'id',
        'email',
        'phone_number',
        'name',
        'company_name',
        'description',
        'video_url',
        'image_url',
        'tags',
        'status',
        'bank_name',
        'account_number',
        'account_holder',
        'business_registration_number',
        'created_at',
        'revoked_at',
      )
      .where('id', id)
      .first();

    if (!partner) {
      throw new NotFoundException(`Partner with id ${id} not found.`);
    }

    return partner;
  }
}
