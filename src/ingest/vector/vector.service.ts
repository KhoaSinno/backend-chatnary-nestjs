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
    return await this.pgvectorService
      .initVectorStore()
      .then(async (vectorStore) => {
        return await vectorStore.addDocuments(
          chunks.map((chunk) => ({
            pageContent: chunk,
            metadata,
          })),
        );
      });
  }
  // Get retrievals from the vector store
  async getRetrievals(query: string, k = 10) {
    return this.pgvectorService.initVectorStore().then(async (vectorStore) => {
      const results = await vectorStore.similaritySearch(query, k);
      return results;
    });
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    return this.pgvectorService.initVectorStore().then(async (vectorStore) => {
      await vectorStore.delete({ filter: { fileId } });
    });
  }

  //   async getRetriever(projectId: string) {
  //     return this.store.asRetriever({
  //       searchType: "similarity",
  //       searchKwargs: { filter: { projectId } },
  //     });
  //   }
}
