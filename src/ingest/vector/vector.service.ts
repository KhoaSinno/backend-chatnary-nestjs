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
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk,
        metadata,
      })),
    );
  }
  // Get retrievals from the vector store
  async getRetrievals(query: string, k = 10) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const results = await vectorStore.similaritySearch(query, k);
    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}
