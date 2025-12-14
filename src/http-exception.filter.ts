import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { request, Response } from 'express';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // -- STATUS CODE DETECTION --
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // -- MESSAGE DETECTION --
    const messageError =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any)?.message || 'Internal server error';

    // -- LOG ERROR --
    this.logger.error(
      `❌ ${request.method} ${request.url}`,
      (exception as any).stack,
    );

    res.status(statusCode).json({
      statusCode: statusCode,
      success: false,
      message: messageError,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
