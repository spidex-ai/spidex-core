import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async acquireLock(key: string, timeout = 5000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();

    const result = await this.redis.set(lockKey, lockValue, 'PX', timeout, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redis.del(lockKey);
  }

  async withLock<T>(key: string, action: () => Promise<T>, timeout = 5000): Promise<T> {
    if (!(await this.acquireLock(key, timeout))) {
      throw new Error('Failed to acquire lock');
    }

    try {
      return await action();
    } finally {
      await this.releaseLock(key);
    }
  }
}
