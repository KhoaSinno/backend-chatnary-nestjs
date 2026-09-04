import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateProjectDto } from './create-project.dto';

describe('CreateProjectDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('accepts a client project payload without a userId', async () => {
    await expect(
      pipe.transform(
        { name: 'My project', color: '#3b82f6' },
        { type: 'body', metatype: CreateProjectDto },
      ),
    ).resolves.toEqual({ name: 'My project', color: '#3b82f6' });
  });

  it('rejects a client-supplied userId', async () => {
    await expect(
      pipe.transform(
        { name: 'My project', userId: 'another-user-id' },
        { type: 'body', metatype: CreateProjectDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
