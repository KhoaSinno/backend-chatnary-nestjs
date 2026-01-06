import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';

/**
 * Universal PostgreSQL Vector Store Configuration
 * Works with: Neon, Supabase, Docker, AWS RDS, Google Cloud SQL, etc.
 *
 * Configuration is driven by environment variables for maximum flexibility.
 */

// Get database configuration based on DATABASE_URL or individual params
const getDatabaseConfig = (): PoolConfig => {
  const databaseUrl =
    process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  // If DATABASE_URL exists, use it directly - pg Pool handles parsing
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,

      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),

      // Keepalive settings (important for cloud databases like NeonDB)
      keepAlive: process.env.DB_KEEPALIVE === 'true',
      keepAliveInitialDelayMillis: parseInt(
        process.env.DB_KEEPALIVE_DELAY || '10000',
      ),

      // SSL configuration - use sslmode from connection string or env var
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized:
                process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            }
          : undefined,
    };
  }

  // Fallback: individual connection parameters (legacy/Docker)
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
    ),
    keepAlive: process.env.DB_KEEPALIVE === 'true',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : undefined,
  };
};

/**
 * Universal PGVector configuration
 * Compatible with all PostgreSQL providers
 *
 * IMPORTANT: This must be a getter function to ensure environment variables
 * are loaded from ConfigModule before accessing them
 */
export const getPgConfig = () => ({
  postgresConnectionOptions: getDatabaseConfig(),
  tableName: process.env.PGVECTOR_TABLE || 'embeddings',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: (process.env.PGVECTOR_DISTANCE_STRATEGY ||
    'cosine') as DistanceStrategy,
});

/**
 * @deprecated Use getPgConfig() instead - lazy evaluation required for env vars
 */
export const pgConfig = getPgConfig();

/**
 * @deprecated Use getPgConfig() instead - it's now universal
 * Kept for backward compatibility
 */
export const getPgConfigNeon = getPgConfig;
