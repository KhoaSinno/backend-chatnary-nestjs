import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';

@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // Add documents to the vector store
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: string[];
    metadata: any;
  }) {
    await this.pgvectorService.initVectorStore().then(async (vectorStore) => {
      await vectorStore.addDocuments(
        chunks.map((chunk) => ({
          pageContent: chunk,
          metadata,
        })),
      );
    });
  }
  // Get retrievals from the vector store
  async getRetrievals(query: string, k = 4) {
    return this.pgvectorService.initVectorStore().then(async (vectorStore) => {
      const results = await vectorStore.similaritySearch(query, k);
      return results;
    });
  }

  //   async getRetriever(projectId: string) {
  //     return this.store.asRetriever({
  //       searchType: "similarity",
  //       searchKwargs: { filter: { projectId } },
  //     });
  //   }
}
