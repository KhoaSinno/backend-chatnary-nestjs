import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IngestProcessor } from './ingest.processor';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                    username: configService.get<string>('REDIS_USERNAME') || 'default',
                    password: configService.get<string>('REDIS_PASSWORD'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'ingest-queue',
        }),
        IngestModule,
        PrismaModule,
    ],
    providers: [IngestProcessor],
    exports: [BullModule],
})
export class QueueModule { }
