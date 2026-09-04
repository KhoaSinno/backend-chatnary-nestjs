import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LoginDto } from './login.dto';

describe('LoginDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('rejects an empty login payload before it can reach Prisma', async () => {
    await expect(
      pipe.transform({}, { type: 'body', metatype: LoginDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a valid login payload', async () => {
    await expect(
      pipe.transform(
        { email: 'user@example.com', password: 'secret1' },
        { type: 'body', metatype: LoginDto },
      ),
    ).resolves.toEqual({ email: 'user@example.com', password: 'secret1' });
  });
});
