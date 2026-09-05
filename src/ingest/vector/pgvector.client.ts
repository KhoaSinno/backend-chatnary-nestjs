import {
  ConsoleLogger,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { LlmService } from '../../llm/llm.service';
import { getPgConfig } from '../../config/pg.config';
import { Pool, PoolClient } from 'pg';
@Injectable()
export class PgvectorService implements OnModuleInit, OnModuleDestroy {
  private vectorStore: PGVectorStore | null = null;
  private pool: Pool | null = null;

  constructor(
    private readonly llm: LlmService,
    private readonly logger: ConsoleLogger,
  ) {}

  // Tự động chạy khi module khởi tạo
  async onModuleInit() {
    await this.initVectorStore();
    // Khuyến nghị: Chỉ chạy dòng này 1 lần khi deploy hoặc migration,
    // nhưng để ở đây cũng được nếu bảng chưa có index nó sẽ tạo.
    // Nếu index đã tồn tại, nó có thể báo lỗi, ta nên dùng try/catch
    try {
      await this.ensureHnswIndex();
    } catch (error: unknown) {
      this.logger.error(
        '⚠️ Warning: HNSW Index check failed (non-fatal)',
        this.errorMessage(error),
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async initVectorStore() {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use universal pgConfig - works with any PostgreSQL provider
    // IMPORTANT: Call getPgConfig() at runtime to ensure env vars are loaded
    const config = getPgConfig();

    // Initialize PG connection pool
    this.pool = new Pool(config.postgresConnectionOptions);

    // 2. BẮT BUỘC: Lắng nghe sự kiện error trên pool
    // Nếu không có dòng này, khi Neon ngắt kết nối, App sẽ Crash ngay lập tức
    this.pool.on('error', (err) => {
      this.logger.error('❌ PG Pool Error (Idle client):', err.message);
      // Không throw error, chỉ log để app tiếp tục chạy và tự reconnect
    });

    this.pool.on('connect', (client: PoolClient) => {
      client.on('error', (err) => {
        this.logger.error('❌ PG Client Error:', err.message);
      });
    });

    // Pass the pool to vector store config
    this.vectorStore = await PGVectorStore.initialize(this.llm.embeddings(), {
      ...config,
      pool: this.pool,
    });

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
  }

  // Expose the pool for direct SQL queries
  async getPool(): Promise<Pool> {
    if (!this.pool) {
      await this.initVectorStore();
    }
    return this.pool!;
  }

  // Get the configured table name
  getTableName(): string {
    const config = getPgConfig();
    return config.tableName;
  }

  // Get the configured metadata column name
  getMetadataColumnName(): string {
    const config = getPgConfig();
    return config.columns.metadataColumnName;
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
    } catch (error: unknown) {
      // PGVector thường throw lỗi nếu Index đã tồn tại.
      // Ta catch lỗi này để không làm crash app.
      const message = this.errorMessage(error);
      if (message.includes('already exists')) {
        this.logger.log('ℹ️ HNSW Index already exists. Skipping creation.');
      } else {
        this.logger.error('❌ Error creating HNSW index:', error);
      }
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
