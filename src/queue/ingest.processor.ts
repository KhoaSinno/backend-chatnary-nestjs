import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { IngestService } from '../ingest/ingest.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
        private readonly eventEmitter: EventEmitter2,
    ) {
        super();
    }

    async process(job: Job<IngestJobData>): Promise<number> {
        const { fileId, filePath, userId, projectId, originalFileName } = job.data;

        this.logger.log(`🚀 Start processing job ${job.id} for file ${fileId}`);

        try {
            // 1. Update Status: PROCESSING
            await this.prisma.document.update({
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

            if (chunks.length === 0) {
                throw new Error('No text chunks were extracted from this document');
            }

            // 3. Update Status: DONE
            await this.prisma.document.update({
                where: { id: fileId },
                data: {
                    status: DocumentStatus.DONE,
                    pageCount: chunks.length, // TODO: Wrong pageCount
                },
            });

            // 4. Emit event
            this.eventEmitter.emit('system.notification', {
                type: 'DOCUMENT_PROCESSED',
                fileId,
                userId,
                projectId,
                status: 'DONE',
                message: 'Xử lý thành công',
            });

            this.logger.log(
                `✅ Completed job ${job.id}. Processed ${chunks.length} chunks.`,
            );

            return chunks.length;
        } catch (error) {
            this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);

            // 4. Update Status: ERROR with error message
            await this.prisma.document.update({
                where: { id: fileId },
                data: {
                    status: DocumentStatus.ERROR,
                    errorMessage: error.message?.substring(0, 500), // Truncate long errors
                },
            });

            // 4. Emit event
            this.eventEmitter.emit('system.notification', {
                type: 'DOCUMENT_PROCESSED',
                fileId,
                userId,
                projectId,
                status: 'ERROR',
                message: 'Xử lý thất bại',
            });

            throw error; // Re-throw for BullMQ retry mechanism
        }
    }
}
