import { decode, encode } from "cbor";
import { blake2b } from "blakejs";
export const getTxHashFromCbor = (cbor: string) => {
    const decoded = decode(cbor)
    // The first element is the transaction body
    const txBody = decoded[0];

    // Re-encode just the transaction body
    const txBodyCbor = encode(txBody);

    // Hash it with blake2b-256
    const txHash = blake2b(txBodyCbor, null, 32);
    return Buffer.from(txHash).toString('hex');
};
