import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`Missing JSON string in field ${metadata.data}`);
    }

    let parsedValue = value;

    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        throw new BadRequestException(
          `Invalid JSON string in field ${metadata.data}`,
        );
      }
    }

    const metatype = metadata.metatype;
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
