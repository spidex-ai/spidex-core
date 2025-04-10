export const transformQuery = (s: string) =>
  s
    ?.trim()
    ?.toLowerCase()
    ?.replace(/['%,'_]/g, (value: string) => `\\${value}`);

export const optionalBooleanMapper = new Map([
  ['undefined', undefined],
  ['true', true],
  ['false', false],
]);
