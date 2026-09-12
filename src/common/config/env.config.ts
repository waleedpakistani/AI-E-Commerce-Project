export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    name: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

export const envConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/ai_ecommerce_db',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    pass: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'ai_ecommerce_db',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
});
