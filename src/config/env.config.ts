export const envConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    chatModel: process.env.OPENAI_CHAT_MODEL,
    rewriteModel: process.env.OPENAI_REWRITE_MODEL,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
  },
  database: {
    // Flexible: works with any PostgreSQL provider (Neon, Supabase, Docker, etc.)
    url: process.env.DATABASE_URL,
    // Optional: for migrations (required by some providers like Neon)
    directUrl: process.env.DATABASE_DIRECT_URL,
    // Connection pool settings (optional, provider-specific)
    pooling: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),
    },
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
