import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';

@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: string[];
    metadata: { fileId: string; projectId?: string };
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk,
        metadata,
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievals(query: string, k = 10, projectId?: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter = projectId ? { projectId } : undefined;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}
