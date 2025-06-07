import BigNumber from 'bignumber.js';
import { createHash } from 'crypto';

/**
 * @param {number}  ms - mili seconds.
 * @returns {Promise<void>} pause the excecution for number of seconds.
 */
export const sleep = (ms: number) => {
  return new Promise(resolve => {
    if (ms > 2147483647) {
      const remaining = ms - 2147483647;
      setTimeout(() => sleep(remaining).then(resolve), 2147483647);
    } else {
      setTimeout(resolve, ms);
    }
  });
};

export function isNullOrUndefined(value: any) {
  return value === null || value === undefined;
}

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const getRandomUserName = () => {
  const NUMBER_CHAR = 6;
  const numberAndLetter = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChar = numberAndLetter.length;
  let randomUserName = '';
  for (let index = 0; index < NUMBER_CHAR; index++) {
    const randomIndex = getRandomNumber(0, numberChar - 1);
    randomUserName += numberAndLetter[randomIndex];
  }
  return randomUserName;
};

export function getVariableName<TResult>(getVar: () => TResult): string {
  const m = /\(\)=>(.*)/.exec(getVar.toString().replace(/(\r\n|\n|\r|\s)/gm, ''));

  if (!m) {
    throw new Error("The function does not contain a statement matching 'return variableName;'");
  }

  const fullMemberName = m[1];

  const memberParts = fullMemberName.split('.');

  return memberParts[memberParts.length - 1];
}

export const hexToUint128 = (hex: string) => {
  return BigInt('0x' + hex);
};

export const generateUint128FromAddress = (address: string): string => {
  const nonce = Date.now().toString() + Math.random().toString();
  const dataToHash = address + nonce;
  const hash = createHash('sha256').update(dataToHash).digest('hex');
  const uint128Hex = hash.substring(0, 32);
  return hexToUint128(uint128Hex).toString();
};

export const getSkip = ({ page, limit }: { page: number; limit: number }) => {
  return (page - 1) * limit;
};

export const getNetAmountEth = ({ ethAmount, fee }: { ethAmount: string; fee: string }) => {
  return new BigNumber(ethAmount).minus(new BigNumber(fee)).toFixed().toString();
};

export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b); // Greatest common divisor (GCD)
};

export const lcm = (a: number, b: number): number => {
  return (a * b) / gcd(a, b); // Least common multiple (LCM)
};

export const lcmOfArray = (numbers: number[]): number => {
  return numbers.reduce((result, num) => lcm(result, num), 1);
};
export const generateUniqueRandomNumber = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1e6).toString(36);
  return `${timestamp}-${randomPart}`;
};

export const getMarketCap = ({ token, ethUsd }: { token: any; ethUsd: string }) => {
  return new BigNumber(token.total_supply)
    .dividedBy(new BigNumber(10).pow(token.decimal))
    .multipliedBy(token.price)
    .multipliedBy(new BigNumber(ethUsd))
    .toFixed()
    .toString();
};
