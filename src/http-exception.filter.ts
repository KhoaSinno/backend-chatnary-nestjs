import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // -- STATUS CODE DETECTION --
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // -- MESSAGE DETECTION --
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const messageError =
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse;

    // -- LOG ERROR --
    this.logger.error(
      `❌ ${req.method} ${req.url}`,
      exception instanceof Error ? exception.stack : undefined,
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
