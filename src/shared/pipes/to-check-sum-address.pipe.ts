import { isAddress, toChecksumAddress } from 'web3-utils';

import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ToChecksumAddressPipe implements PipeTransform<any, any> {
  transform(value: string): any {
    let val = value;
    if (typeof val === 'string') {
      if (isAddress(val)) {
        val = toChecksumAddress(val);
      }
    } else if (typeof val === 'object' && val) {
      val = this.parse(val);
    }

    return val;
  }

  parse(object: any) {
    const validKeys = ['address', 'userAddress', 'walletAddress', 'tokenAddress', 'contractAddress', 'tokenFactory'];
    if (object && typeof object === 'object') {
      for (const key of Object.keys(object)) {
        if (typeof object[key] === 'string' && isAddress(object[key]) && validKeys.includes(key)) {
          object[key] = toChecksumAddress(object[key]);
        }

        if (typeof object[key] === 'object') {
          object[key] = this.parse(object[key]);
        }
      }
    }

    return object;
  }
}
