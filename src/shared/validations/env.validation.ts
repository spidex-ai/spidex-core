import { EEnvironment, EEnvKey } from '@constants/env.constant';
import { plainToClass, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
    @IsEnum(EEnvironment)
    [EEnvKey.NODE_ENV]: EEnvironment;

    @IsString()
    [EEnvKey.APP_NAME]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_DESCRIPTION]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_GLOBAL_PREFIX]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_SWAGGER_PATH]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_DOCS_SCHEMA]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_VERSION]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_HOST]: string;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    [EEnvKey.APP_PORT]: number;

    @IsString()
    @IsOptional()
    [EEnvKey.APP_HOST_NAME]: string;

    @IsString()
    [EEnvKey.JWT_ACCESS_TOKEN_SECRET]: string;

    @IsNumber()
    @Type(() => Number)

    [EEnvKey.JWT_ACCESS_TOKEN_EXPIRATION_TIME]: string;

    @IsString()
    [EEnvKey.JWT_REFRESH_TOKEN_SECRET]: string;

    @IsNumber()
    @Type(() => Number)
    [EEnvKey.JWT_REFRESH_TOKEN_EXPIRATION_TIME]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.GOOGLE_RECAPCHA_SECRET_KEY]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.VERIFICATION_URL]: string;

    @IsString()
    [EEnvKey.WALLET_SIGN_MESSAGE]: string;

    @IsString()
    @IsOptional()
    [EEnvKey.LOG_LEVEL]: string;

    @IsString()
    [EEnvKey.DB_TYPE]: string;

    @IsString()
    [EEnvKey.DB_HOST]: string;

    @IsNumber()
    @Type(() => Number)
    [EEnvKey.DB_PORT]: number;

    @IsString()
    [EEnvKey.DB_USERNAME]: string;

    @IsString()
    [EEnvKey.DB_PASSWORD]: string;

    @IsString()
    [EEnvKey.DB_NAME]: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    [EEnvKey.DB_SYNC]: boolean;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_LOG]: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    [EEnvKey.DB_RETRY_ATTEMPT]: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    [EEnvKey.DB_RETRY_DELAY]: number;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_EXTRA]: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    [EEnvKey.DB_MAX_CONNECTIONS]: number;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_SSL_ENABLED]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_REJECT_UNAUTHORIZED]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_CA]: string;

    @IsString()
    [EEnvKey.DB_KEY]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.DB_CERT]: string;

    @IsString()
    [EEnvKey.DB_URL]: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    [EEnvKey.ADMINER_PORT]: number;

    @IsNumber()
    @Type(() => Number)
    [EEnvKey.REDIS_PORT]: number;

    @IsString()
    [EEnvKey.REDIS_HOST]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.REDIS_PASSWORD]: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    [EEnvKey.REDIS_DB]: number;

    @IsString()
    [EEnvKey.S3_ACCESS_KEY_ID]: string;

    @IsString()
    [EEnvKey.S3_SECRET_ACCESS_KEY]: string;

    @IsString()
    [EEnvKey.S3_BUCKET]: string;

    @IsString()
    [EEnvKey.S3_REGION]: string;

    @IsString()
    [EEnvKey.CRYPTO_SECRET_KEY]: string;

    @IsString()
    [EEnvKey.FIREBASE_SERVICE_ACCOUNT_PATH]: string;

    @IsString()
    [EEnvKey.X_BASE_URL]: string;

    @IsString()
    [EEnvKey.X_CLIENT_ID]: string;

    @IsString()
    [EEnvKey.X_CLIENT_SECRET]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.IS_WRITE_LOG]: string;

    @IsString()
    [EEnvKey.KAFKA_PROVIDER]: string;

    @IsString()
    [EEnvKey.KAFKA_BROKERS]: string;

    @IsString()
    [EEnvKey.KAFKA_CLIENT_ID]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.KAFKA_SSL]: string;

    @IsOptional()
    @IsString()
    [EEnvKey.KAFKA_REGION]: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    console.log({ validatedConfig })
    return validatedConfig;
}
