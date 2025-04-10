export interface IDeadLetterMessage<T> {
    key: string;
    message: T;
    stack: string;
    deadLetterReason: string;
    retryCount: number;
}
