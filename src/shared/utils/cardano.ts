import { decode, encode } from 'cbor';
import { blake2b } from 'blakejs';
import * as crypto from 'crypto';
export const getTxHashFromCbor = (cbor: string) => {
  const decoded = decode(cbor);
  // The first element is the transaction body
  const txBody = decoded[0];

  // Re-encode just the transaction body
  const txBodyCbor = encode(txBody);

  // Hash it with blake2b-256
  const txHash = blake2b(txBodyCbor, null, 32);
  return Buffer.from(txHash).toString('hex');
};

export const generateRandomCbor = (): string => {
  const length = 32; // Length of the random bytes
  const randomBytes = new Uint8Array(length);
  crypto.randomFillSync(randomBytes);
  return encode(randomBytes).toString('hex');
};
