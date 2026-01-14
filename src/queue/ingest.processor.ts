import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { IngestService } from '../ingest/ingest.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

export interface IngestJobData {
    fileId: string;
    filePath: string;
    userId: string;
    projectId?: string;
    originalFileName?: string;
}

@Processor('ingest-queue')
export class IngestProcessor extends WorkerHost {
    private readonly logger = new Logger(IngestProcessor.name);

    constructor(
        private readonly ingestService: IngestService,
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    async process(job: Job<IngestJobData>): Promise<number> {
        const { fileId, filePath, userId, projectId, originalFileName } = job.data;

        this.logger.log(`🚀 Start processing job ${job.id} for file ${fileId}`);

        try {
            // 1. Update Status: PROCESSING
            await this.prisma.documents.update({
                where: { id: fileId },
                data: { status: DocumentStatus.PROCESSING },
            });

            // 2. Call existing Ingest logic (Cloud loader -> Split -> Embed -> PGVector)
            const chunks = await this.ingestService.ingestDocument(
                filePath,
                fileId,
                userId,
                projectId,
                originalFileName,
            );

            // 3. Update Status: DONE
            await this.prisma.documents.update({
                where: { id: fileId },
                data: {
                    status: DocumentStatus.DONE,
                    pageCount: chunks.length, // Approximate page count from chunks
                },
            });

            this.logger.log(
                `✅ Completed job ${job.id}. Processed ${chunks.length} chunks.`,
            );

            return chunks.length;
        } catch (error) {
            this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);

            // 4. Update Status: ERROR with error message
            await this.prisma.documents.update({
                where: { id: fileId },
                data: {
                    status: DocumentStatus.ERROR,
                    errorMessage: error.message?.substring(0, 500), // Truncate long errors
                },
            });

            throw error; // Re-throw for BullMQ retry mechanism
        }
    }
}
