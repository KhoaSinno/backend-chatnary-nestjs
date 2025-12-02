import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();
    // -- RETURN WRAPPED RESPONSE --
    return next.handle().pipe(
      map((data: any) => {
        // If response already formatted → do NOTHING
        if (
          data &&
          typeof data === 'object' &&
          data.hasOwnProperty('statusCode') &&
          data.hasOwnProperty('success')
        ) {
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
