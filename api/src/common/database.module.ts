// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import knex from 'knex';
import config from 'src/config';

@Module({
  providers: [
    {
      // 직접만든 knex 인스턴스를 '이름'으로 등록.-> DI 주입용
      provide: 'KNEX_CONNECTION',
      // 로직을 생성해서 주입하는 경우
      useFactory: async () => {
        // 테스트 환경이면 in-memory SQLite 사용
        if (process.env.NODE_ENV === 'test') {
          return knex({
            client: 'sqlite3',
            connection: {
              filename: ':memory:',
            },
            useNullAsDefault: true,
          });
        }
        // 기본 환경: config.ts의 설정에 따라 MariaDB (mysql2) 사용
        return knex({
          client: 'mysql2',
          connection: {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
          },
          pool: { min: 2, max: 10 },
        });
      },
    },
  ],
  exports: ['KNEX_CONNECTION'],
})
export class DatabaseModule {}
