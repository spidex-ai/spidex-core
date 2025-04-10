import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClientRedis } from '@shared/utils/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';


class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;

    async connectToRedis(): Promise<void> {
        const pubClient = createClientRedis();
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}

export async function connectRedisAdapter(app: NestExpressApplication) {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();

    app.useWebSocketAdapter(redisIoAdapter);
}
