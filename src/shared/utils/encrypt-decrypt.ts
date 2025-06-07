import * as cryptoJs from 'crypto-js';
import * as process from 'node:process';
import * as dotenv from 'dotenv';
dotenv.config();

export const encryptWithAES = (text: string) => {
  const b64 = cryptoJs.AES.encrypt(text, process.env.CRYPTO_SECRET_KEY).toString();
  const e64 = cryptoJs.enc.Base64.parse(b64);
  const eHex = e64.toString(cryptoJs.enc.Hex);
  return eHex;
};

export const decryptWithAES = (ciphertext: string) => {
  const reb64 = cryptoJs.enc.Hex.parse(ciphertext);
  const bytes = reb64.toString(cryptoJs.enc.Base64);
  const decrypt = cryptoJs.AES.decrypt(bytes, process.env.CRYPTO_SECRET_KEY);
  const plain = decrypt.toString(cryptoJs.enc.Utf8);
  return plain;
};

export const generateSocketHash = () => {
  const randomText = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let hash = 0;

  for (let i = 0; i < randomText.length; i++) {
    const char = randomText.charCodeAt(i);
    hash = (hash << 5) - hash + char; // Simple hash algorithm
    hash |= 0; // Convert to 32-bit integer
  }

  return hash.toString(16); // Return the hash as a hexadecimal string
};
