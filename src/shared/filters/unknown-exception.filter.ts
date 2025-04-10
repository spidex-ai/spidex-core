import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { IResponse } from '@shared//interceptors/response.interceptor';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@Catch()
export class UnknownExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggerService) {}
  private logger = this.loggingService.getLogger('unknown-exception');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    this.logger.error(exception);
    const defaultResponse: IResponse<any> = {
      data: null,
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      message: 'Internal server error!',
      success: false,
    };
    response.status(defaultResponse.status_code).json(defaultResponse);
  }
}
