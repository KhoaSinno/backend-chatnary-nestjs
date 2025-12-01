export const envConfig = () => ({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-api-key',
  DATABASE_URL_NEON: process.env.DATABASE_URL_NEON || 'your-database-url',
});
