import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';

import { RedisClientType } from 'redis';

import { LoggerService } from '../loggers/logger.service';

@Injectable()
export class SocketEmitterService implements OnModuleInit {
  private logger = this.loggerService.getLogger('SOCKET_EMITTER_SERVICE');
  private __emitter: Emitter;

  constructor(
    @Inject('REDIS')
    private readonly redisClient: RedisClientType,
    private loggerService: LoggerService,
  ) { }

  async onModuleInit(): Promise<void> {
    await this.initEmitter();
  }

  private async initEmitter(): Promise<void> {
    this.__emitter = new Emitter(this.redisClient);
  }

  get emitter(): Emitter {
    return this.__emitter;
  }

}
