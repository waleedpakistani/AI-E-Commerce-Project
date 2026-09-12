import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

export type DrizzleDB = PostgresJsDatabase<typeof schema>;
