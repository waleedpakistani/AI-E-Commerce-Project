import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DRIZZLE } from './database.types';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString =
          configService.get<string>('DATABASE_URL') ||
          'postgres://postgres:postgres@localhost:5432/ai_ecommerce_db';

        const queryClient = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
