import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';

// Sample config
export const pgConfig = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5433,
    user: 'ChatnarySYS',
    password: '123123',
    database: 'api',
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
