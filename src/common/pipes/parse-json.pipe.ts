import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  constructor(private readonly targetDto?: ClassConstructor<object>) {}

  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`Missing JSON string in field ${metadata.data ?? 'data'}`);
    }

    let parsedValue = value;

    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        throw new BadRequestException(
          `Invalid JSON string in field ${metadata.data ?? 'data'}`,
        );
      }
    } else if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>;
      if (typeof record.data === 'string') {
        try {
          parsedValue = { ...record, ...JSON.parse(record.data) };
        } catch {
          throw new BadRequestException(`Invalid JSON string in field data`);
        }
      }
    }

    const metatype = this.targetDto || metadata.metatype;
    if (!metatype || this.isPrimitive(metatype)) {
      return parsedValue;
    }

    const dto = plainToInstance(
      metatype as ClassConstructor<object>,
      parsedValue,
    );
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );
      throw new BadRequestException(messages);
    }

    return dto;
  }

  private isPrimitive(metatype: Function): boolean {
    return (
      metatype === String ||
      metatype === Boolean ||
      metatype === Number ||
      metatype === Array ||
      metatype === Object
    );
  }
}
