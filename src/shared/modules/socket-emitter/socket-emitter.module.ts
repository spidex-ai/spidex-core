import { Module } from '@nestjs/common';
import { CustomizeRedisModule } from 'config/redis.module';
import { SocketEmitterService } from './socket-emitter.service';

@Module({
  imports: [CustomizeRedisModule],
  providers: [SocketEmitterService],
  exports: [SocketEmitterService],
})
export class SocketEmitterModule {}
