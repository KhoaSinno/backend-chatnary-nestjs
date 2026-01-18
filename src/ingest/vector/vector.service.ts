import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';
import { ChunkResult } from '../splitters/text-splitter';
import { PrismaService } from '../../prisma/prisma.service';

type Metadata = {
  fileId: string;
  projectId?: string;
  userId: string;
  fileUrl: string;
};
@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService, private readonly prisma: PrismaService) { }

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: ChunkResult[];
    metadata: Metadata;
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          chunkIndex: chunk.chunkIndex,
          ...metadata,
          ...chunk.metadata,
        },
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievalsWithK(
    query: string,
    k: number,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    // If projectId provided → filter by project only (for project members)
    // If no projectId → filter by userId (global chat)
    const filter: { userId?: string; projectId?: string } = projectId
      ? { projectId }
      : { userId };

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 30,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    // If projectId provided → filter by project only (for project members)
    // If no projectId → filter by userId (global chat)
    const filter: { userId?: string; projectId?: string, fileId?: { in: string[] } } = projectId
      ? { projectId }
      : { userId };

    let filnalFilter = { ...filter };

    if (projectId) {
      // Fetch + Add fillter doc have isSelected = true
      const activeDocs = await this.prisma.projectResources.findMany({
        where: {
          projectId,
          isSelected: true,
        }
      })

      const activeDocIds = activeDocs.map((doc) => doc.documentId);

      if (projectId && activeDocIds.length === 0) {
        return []; // Don't waste tokens searching if nothing is selected
      }

      filnalFilter = {
        fileId: {
          in: activeDocIds,
        },
      };
    }

    const results = await vectorStore.similaritySearchWithScore(
      query,
      k,
      filnalFilter,
    );

    return results;
  }

  async link2Project(docIds: string[], projectId: string) {
    // PGVectorStore doesn't have an update() method
    // We need to update the metadata directly using SQL
    const pool = await this.pgvectorService.getPool();
    const tableName = this.pgvectorService.getTableName();
    const metadataColumn = this.pgvectorService.getMetadataColumnName();

    await Promise.all(
      docIds.map(async (docId) => {
        // Update the metadata column by merging the new projectId
        await pool.query(
          `UPDATE ${tableName} 
           SET ${metadataColumn} = jsonb_set(${metadataColumn}, '{projectId}', $1::jsonb, true)
           WHERE ${metadataColumn}->>'fileId' = $2`,
          [JSON.stringify(projectId), docId]
        );
      })
    );
  }

  async removeOutProject(docIds: string[], projectId: string) {
    const pool = await this.pgvectorService.getPool();
    const tableName = this.pgvectorService.getTableName();
    const metadataColumn = this.pgvectorService.getMetadataColumnName();

    await Promise.all(
      docIds.map(async (docId) => {
        // Dùng toán tử '-' để xóa key khỏi JSONB
        await pool.query(
          `UPDATE ${tableName} 
           SET ${metadataColumn} = ${metadataColumn} - 'projectId'
           WHERE ${metadataColumn}->>'fileId' = $1 
           AND ${metadataColumn}->>'projectId' = $2`,
          [docId, projectId]
        );
      })
    );
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}
