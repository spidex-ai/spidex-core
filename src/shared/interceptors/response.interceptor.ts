import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '@shared/modules/loggers/logger.service';

export const defaultResponse: IResponse<[]> = {
  success: true,
  status_code: HttpStatus.OK,
  message: '',
  data: null,
  validator_errors: [],
};

export interface IResponse<T> {
  status_code?: HttpStatus;
  data?: T;
  metadata?: {
    [key: string]: any;
  };
  message?: string | null;
  success?: boolean;
  validator_errors?: any | any[];
}
export function createResponse<T>(data: any): IResponse<T> {
  delete data?.password;
  return {
    status_code: data?.status_code ? data.status_code : HttpStatus.OK,
    data: data?.data || data || [],
    metadata: data?.meta
      ? { ...data.meta, timestamp: new Date() }
      : { timestamp: new Date() },
    success: true,
    message: data?.message ? data?.message : '',
  };
}
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, IResponse<T>> {
  constructor(private readonly loggingService: LoggerService) { }
  private logger = this.loggingService.getLogger('Request');
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, query, params } = request;
    //todo: optimize logger body hidden password
    let body = request?.body;
    try {
      if (body && body instanceof Object) {
        body = JSON.parse(JSON.stringify(request?.body));
        if (body?.password) {
          // this.logger.info(`Hidden password`);
          delete body.password;
        }
        // this.logger.info(`Body: `, JSON.stringify(body));
      }
    } catch (e) {
      this.logger.error(`Error: ${e}`);
    }

    this.logger.info(
      JSON.stringify({ method, url, headers, query, params, body }),
    );
    // Ignore endpoint apply Interceptor
    const bypassRoutes = [
      /^\/events\/metadata\/\d+$/,
      /^\/events\/metadata\/\d+\/$/,
      /^\/events\/metadata\/\d+\/\d+$/,
    ];

    if (bypassRoutes.some((regex) => regex.test(request.path))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const responseData = createResponse(data);
        response.status(responseData.status_code);
        return createResponse(data);
      }),
    );
  }
}
