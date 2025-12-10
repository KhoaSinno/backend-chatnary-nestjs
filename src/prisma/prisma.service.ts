import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.get<string>('database.url'),
    });
    super({ adapter } as any);
  }
}
