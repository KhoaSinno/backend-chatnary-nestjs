import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ParseJsonPipe } from './parse-json.pipe';
import { UploadMetadataDto } from '../../document/dto/upload-document.dto';

describe('ParseJsonPipe', () => {
  const metadata: ArgumentMetadata = {
    type: 'body',
    data: 'data',
    metatype: UploadMetadataDto,
  };

  it('parses and validates upload metadata', async () => {
    const pipe = new ParseJsonPipe();

    await expect(
      pipe.transform(JSON.stringify({ projectId: 'project-id' }), metadata),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      pipe.transform(
        JSON.stringify({ projectId: 'c5f2cc9e-779f-4a3b-9208-2c7cecd1a70f' }),
        metadata,
      ),
    ).resolves.toBeInstanceOf(UploadMetadataDto);
  });

  it('rejects missing metadata instead of passing undefined to the controller', async () => {
    const pipe = new ParseJsonPipe();

    await expect(pipe.transform(undefined, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

