import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import * as exc from '@shared//exception';
import { IResponse } from '@shared/interceptors/response.interceptor';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggerService) { }
  private logger = this.loggingService.getLogger('http-exception');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // const status = exception.getStatus();
    let excResponse = exception.getResponse() as IResponse<any> | any;
    this.logger.warn(excResponse);
    if (typeof excResponse !== 'object' || !excResponse.hasOwnProperty('success')) {
      let newDataResponse: Record<string, any> =
        typeof excResponse === 'object' ? excResponse : { message: excResponse };
      newDataResponse = newDataResponse?.error;
      excResponse = new exc.BadRequestException({
        success: false,
        status_code: excResponse.status_code ? excResponse.status_code : HttpStatus.BAD_REQUEST,
        data: newDataResponse,
        validator_errors: excResponse?.validator_errors,
        message: excResponse.message,
      }).getResponse();
    }
    response.status(excResponse.status_code).json(excResponse);
  }
}
