import Web3 from 'web3';

export interface IRpcService {
    web3: Web3;
    resetApi: () => Promise<any>;
    maxTries: number;
    // privateKeys: string[];
    getNonce: (walletAddress: string) => Promise<number>;
}