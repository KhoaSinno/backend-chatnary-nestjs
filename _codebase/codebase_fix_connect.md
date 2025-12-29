# Project Export

## Project Statistics

- Total files: 4

## Folder Structure

```
src
  config
    env.config.ts
    pg.config.ts
  ingest
    vector
      pgvector.client.ts
  main.ts

```

### src\config\env.config.ts

```ts
export const envConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
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

```

### src\config\pg.config.ts

```ts
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
  const databaseUrl = process.env.DATABASE_URL;

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

```

### src\ingest\vector\pgvector.client.ts

```ts
import { ConsoleLogger, Injectable, OnModuleInit } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { getPgConfig } from '../../config/pg.config';

@Injectable()
export class PgvectorService implements OnModuleInit {
  private vectorStore: PGVectorStore | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}

  // Tự động chạy khi module khởi tạo
  async onModuleInit() {
    await this.initVectorStore();
    // Khuyến nghị: Chỉ chạy dòng này 1 lần khi deploy hoặc migration,
    // nhưng để ở đây cũng được nếu bảng chưa có index nó sẽ tạo.
    // Nếu index đã tồn tại, nó có thể báo lỗi, ta nên dùng try/catch
    await this.ensureHnswIndex();
  }

  async initVectorStore() {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use universal pgConfig - works with any PostgreSQL provider
    // IMPORTANT: Call getPgConfig() at runtime to ensure env vars are loaded
    const config = getPgConfig();

    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      config,
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
  }

  // ---  INDEX HNSW ---
  async ensureHnswIndex() {
    if (!this.vectorStore) await this.initVectorStore();

    this.logger.log('🏗️ Checking/Creating HNSW Index...');

    try {
      // Các thông số này tối ưu cho OpenAI (1536 dimensions)
      await this.vectorStore?.createHnswIndex({
        dimensions: 1536,
        m: 16, // Số kết nối mỗi node (Default: 16)
        efConstruction: 64, // Độ sâu tìm kiếm khi xây dựng index (Default: 64)
      });
      this.logger.log('✅ HNSW Index created successfully');
    } catch (error) {
      // PGVector thường throw lỗi nếu Index đã tồn tại.
      // Ta catch lỗi này để không làm crash app.
      if (error.message && error.message.includes('already exists')) {
        this.logger.log('ℹ️ HNSW Index already exists. Skipping creation.');
      } else {
        this.logger.error('❌ Error creating HNSW index:', error);
      }
    }
  }
}

```

### src\main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './response.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Replace the default NestJS logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // --- Config CORS ---
  // Dev mode: Allow all origins
  app.enableCors();

  /* //  Production mode: Restrict origins
  app.enableCors({
    origin: ['http://localhost:3000', 'https://chatnary.com'], // Add your allowed origins here
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies
  });
  */

  const config = new DocumentBuilder()
    .setTitle('Chatnary API')
    .setDescription('The Chatnary API description')
    .setVersion('1.0')
    .addTag('chatnary')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // -- Response interceptor --
  app.useGlobalInterceptors(new ResponseInterceptor());
  // -- HTTP exception filter --
  app.useGlobalFilters(new HttpExceptionFilter());
  // -- Prefix all routes with /api/v1 --
  app.setGlobalPrefix('api/v1');
  // -- Swagger setup --
  SwaggerModule.setup('api/v1/docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();

```
