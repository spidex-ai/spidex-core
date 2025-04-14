import { InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaContext } from "@nestjs/microservices";
import { KafkaConfig } from "@nestjs/microservices/external/kafka.interface";
import { sleep } from "@shared/utils/util";
import { split } from 'lodash'
import { createMechanism } from '@jm18457/kafkajs-msk-iam-authentication-mechanism';


const getAWSKafkaConfig = (config: ConfigService): KafkaConfig => {
    const clientId = config.get('KAFKA_CLIENT_ID');
    const brokers = split(config.get('KAFKA_BROKERS'), ',');
    const ssl = config.get('KAFKA_SSL');
    const region = config.get('KAFKA_REGION');
    const accessKeyId = config.get('KAFKA_ACCESS_KEY_ID');
    const secretAccessKey = config.get('KAFKA_SECRET_ACCESS_KEY');
    const sasl = createMechanism({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return {
        clientId,
        brokers,
        ssl,
        sasl,
    };
};

export const getKafkaConfig = (config: ConfigService): KafkaConfig => {
    const provider = config.get('KAFKA_PROVIDER');
    if (provider === 'msk') {
        return getAWSKafkaConfig(config);
    }
    return {
        clientId: config.get('KAFKA_CLIENT_ID'),
        brokers: split(config.get('KAFKA_BROKERS'), ','),
    };
};



export async function heartbeatWrapped(context: KafkaContext, logger: Logger, name: string, handler: (context: KafkaContext) => Promise<void>, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000; // 3s
    const TIMEOUT = 30000; // 30s
    const INTERVAL = 10000; // 10s

    const heartbeat = context.getHeartbeat();

    // Send first heartbeat immediately
    await heartbeat();

    let isRunning = true;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let timeoutHandle: NodeJS.Timeout | null = null;

    // Start heartbeat interval
    heartbeatInterval = setInterval(async () => {
        if (!isRunning) return;

        try {
            logger.debug(`heartbeat: ${name}`);
            await heartbeat();
        } catch (error) {
            logger.error(`Failed to send heartbeat for ${name}:`, error);
        }
    }, INTERVAL);

    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error(`Handler ${name} timed out after ${TIMEOUT}ms`));
        }, TIMEOUT);
    });

    try {
        // Race between handler and timeout
        await Promise.race([
            handler(context),
            timeoutPromise
        ]);
    } catch (error) {
        // Check if it's a timeout error and we can retry
        if (error.message?.includes('timed out') && retryCount < MAX_RETRIES) {
            logger.warn(`${name} timed out, retrying (${retryCount + 1}/${MAX_RETRIES})...`);

            // Clean up current timeouts and intervals
            isRunning = false;
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (timeoutHandle) clearTimeout(timeoutHandle);

            // Wait before retrying
            await sleep(RETRY_DELAY)

            // Recursive retry with incremented counter
            return heartbeatWrapped(context, logger, name, handler, retryCount + 1);
        }

        logger.error(`Error in handler ${name} after ${retryCount} retries:`, error);
        // Ensure we're throwing a proper Error object
        const errorToThrow = error?.message
            ? new Error(error.message)
            : new Error(typeof error === 'string' ? error : 'An unknown error occurred');
        throw new InternalServerErrorException(errorToThrow);
    } finally {
        isRunning = false;

        // Safely clear interval and timeout
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}
