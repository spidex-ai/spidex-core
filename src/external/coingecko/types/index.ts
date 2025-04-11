export interface CoingeckoTokenPrice {
    [unit: string]: {
        [vsCurrency: string]: number;
    };
}
