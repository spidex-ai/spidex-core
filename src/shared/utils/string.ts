export function createSubParagraphWithTheGivenNumberOfCharacters(paragraph: string, charCount: number): string {
  let totalCharCount = 0;
  return [...paragraph].reduce((result, char) => {
    if (totalCharCount >= charCount) return result;
    totalCharCount++;
    return result + char;
  }, '');
}

export function toHexString(input: string): string {
  return Buffer.from(input, 'utf8').toString('hex');
}
