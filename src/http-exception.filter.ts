import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const res: Response = host.switchToHttp().getResponse();
    const messageError =
      exception instanceof Error ? exception.message : 'Internal server error';
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: messageError,
    });
  }
}
