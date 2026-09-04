import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  const response = { statusCode: 200 };
  const context = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ExecutionContext;

  it('does not wrap StreamableFile responses', async () => {
    const interceptor = new ResponseInterceptor();
    const streamableFile = new StreamableFile(Buffer.from('document'));
    const next = { handle: () => of(streamableFile) } as CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe(streamableFile);
  });

  it('wraps ordinary controller data in the API envelope', async () => {
    const interceptor = new ResponseInterceptor();
    const next = { handle: () => of({ id: 'document-1' }) } as CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      statusCode: 200,
      success: true,
      data: { id: 'document-1' },
    });
  });
});
