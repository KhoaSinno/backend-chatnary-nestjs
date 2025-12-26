import { ConsoleLogger, Injectable, OnModuleInit } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { pgConfig, getPgConfigNeon } from '../../config/pg.config';

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

    const useNeon = !!process.env.DATABASE_URL_NEON;
    const config = useNeon ? getPgConfigNeon() : pgConfig;

    this.logger.log('🔧 PGVector Config:', {
      useNeon,
      connectionString: useNeon
        ? process.env.DATABASE_URL_NEON?.substring(0, 30) + '...'
        : `${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}`,
    });

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
