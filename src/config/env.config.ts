export const envConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  database: {
    url: process.env.DATABASE_URL_NEON,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  jwtRefresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
});
