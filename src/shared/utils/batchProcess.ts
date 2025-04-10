import { sleep } from '@shared/utils/util';

export async function batchProcess(
  concurrent: number,
  callbacks: CallableFunction[],
) {
  let queue = [];
  for (let i = 0; i < callbacks.length; i++) {
    queue.push(callbacks[i]());
    if (i % concurrent === 0) {
      await Promise.all(queue);
      queue = [];
      await sleep(1000);
      continue;
    }
  }
  await Promise.all(queue);
  return true;
}
