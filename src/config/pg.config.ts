import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';

// Sample config
export const pgConfig = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'db',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'ChatnarySYS',
    password: process.env.POSTGRES_PASSWORD || '123123',
    database: process.env.POSTGRES_DB || 'api',
  } as PoolConfig,
  tableName: 'documents',
  //   columns: {
  //     idColumnName: 'id',
  //     vectorColumnName: 'vector',
  //     contentColumnName: 'content',
  //     metadataColumnName: 'metadata',
  //   },
  // supported distance strategies: cosine (default), innerProduct, or euclidean
  distanceStrategy: 'cosine' as DistanceStrategy,
};
