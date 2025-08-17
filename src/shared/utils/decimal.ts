import assert from 'assert';
import BigNumber from 'bignumber.js';
BigNumber.set({
  EXPONENTIAL_AT: 1e9,
});
export const removeDecimal = (value: string, decimal: number) => {
  assert(decimal > 0, 'invalid decimal');
  const divider = new BigNumber(10).pow(decimal);
  return BigNumber(value).dividedBy(divider);
};

export const addDecimal = (value: string, decimal: number) => {
  assert(decimal > 0, 'invalid decimal');
  const multiplier = new BigNumber(10).pow(decimal);
  return BigNumber(value).multipliedBy(multiplier);
};
