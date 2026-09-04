import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

interface SuccessResponse<T> {
  statusCode: number;
  success: true;
  data: T;
}

function isSuccessResponse(value: unknown): value is SuccessResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'success' in value
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown>> {
    const res = context.switchToHttp().getResponse<Response>();
    // -- RETURN WRAPPED RESPONSE --
    return next.handle().pipe(
      map((data: unknown) => {
        // If response already formatted → do NOTHING
        if (isSuccessResponse(data)) {
          return data;
        }
        return {
          statusCode: res.statusCode || 200,
          // message: data?.message ?? 'success',
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}

// ========== UPDATED VERSION ==========
// import {
//   CallHandler,
//   ExecutionContext,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { Response } from 'express';

// export interface ApiResponse<T> {
//   statusCode: number;
//   success: boolean;
//   data: T;
// }

// function isWrappedResponse(data: unknown): data is ApiResponse<unknown> {
//   return (
//     typeof data === 'object' &&
//     data !== null &&
//     'success' in data &&
//     'statusCode' in data
//   );
// }

// @Injectable()
// export class ResponseInterceptor<T>
//   implements NestInterceptor<T, ApiResponse<T>>
// {
//   intercept(
//     context: ExecutionContext,
//     next: CallHandler<T>,
//   ): Observable<ApiResponse<T>> {
//     const res = context.switchToHttp().getResponse<Response>();

//     return next.handle().pipe(
//       map((data: T) => {
//         if (isWrappedResponse(data)) {
//           return data;
//         }

//         return {
//           statusCode: res.statusCode ?? 200,
//           success: true,
//           data,
//         };
//       }),
//     );
//   }
// }
