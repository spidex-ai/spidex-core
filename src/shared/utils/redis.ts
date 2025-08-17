import { createClient, RedisClientType } from 'redis';

export const getRedisUserKey = (id: string, iat: string | number) => `token:user:${id}:${iat}`;
export const getRedisAdminKey = (id: number, iat: string | number) => `token:admin:${id}:${iat}`;

export function createClientRedis(): RedisClientType {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;
  const database = +process.env.REDIS_DB || 0;

  return createClient({
    url: `redis://${host}:${port}`,
    password,
    database,
  });
}
