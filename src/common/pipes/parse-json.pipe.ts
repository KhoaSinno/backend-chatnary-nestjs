import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Nếu value không tồn tại hoặc không phải string, trả về undefined hoặc giữ nguyên
    if (!value || typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException(
        `Invalid JSON string in field ${metadata.data}`,
      );
    }
  }
}
