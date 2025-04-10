// Function to divide the array into smaller arrays
export function divideArray(array, chunkSize) {
  const dividedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    dividedArray.push(chunk);
  }
  return dividedArray;
}