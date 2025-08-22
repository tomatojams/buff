import * as dotenv from 'dotenv';

dotenv.config(); // 이 줄이 .env 파일 읽어오는 역할

const config = {
  local: {
    webEndpoint: 'http://localhost:3000',
    s3Bucket: 'naksiya-assets.s3.ap-northeast-2.amazonaws.com',
    db: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'S0ma!DB_2025',
      database: 'naksiya',
    },
    redis: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  localdocker: {
    webEndpoint: 'http://localhost:3000',
    s3Bucket: 'cdn.naksiya.co.kr',
    db: {
      host: '127.0.0.1',
      port: 13306, // Docker용 MariaDB 포트
      user: 'root',
      password: 'S0ma!DB_2025',
      database: 'naksiya',
    },
    redis: {
      host: '127.0.0.1',
      port: 16379, // Docker용 Redis 포트
    },
  },
  development: {
    webEndpoint: 'https://naksiya.co.kr',
    s3Bucket: 'cdn.naksiya.co.kr',
    db: {
      host: 'mariadb',
      port: 3306,
      user: 'root',
      password: 'S0ma!DB_2025',
      database: 'naksiya',
    },
    redis: {
      host: 'redis',
      port: 6379,
    },
  },
  staging: {
    webEndpoint: 'http://211.37.147.141',
    s3Bucket: 'naksiya-assets.s3.ap-northeast-2.amazonaws.com',
    db: {
      host: 'naksiyanolja-db.cmklzs9prl64.ap-northeast-2.rds.amazonaws.com',
      port: 3306,
      user: 'naksiyanolja',
      password: 'xWtEBCUcKvHlN1o1aRAA',
      database: 'naksiya',
    },
    redis: {
      host: 'host.docker.internal', // 여기도
      port: 6379,
    },
  },

  test: {
    webEndpoint: 'http://localhost:3000',
    s3Bucket: 'cdn.naksiya.co.kr',
    db: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'S0ma!DB_2025',
      database: 'naksiya_test',
    },
    redis: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  production: {
    webEndpoint: 'https://naksiya.co.kr',
    s3Bucket: 'cdn.naksiya.co.kr',
    db: {
      host: '127.0.0.1',
      port: 3306,
      user: 'user',
      password: 'S0ma!DB_2025',
      database: 'naksiya',
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
  },
};

const env = process.env.ENVIRONMENT || 'local';

export default config[env as keyof typeof config];
