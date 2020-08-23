import { WrappedError } from "./error";

/**
 * Promise.allSettled that throws a WrappedError, avoiding silent failures
 * @param promises
 */
export async function promiseAllThrow<T>(
  promises: Promise<T>[],
  errorMessage: string
): Promise<T[]> {
  if (promises.length == 0) {
    return Promise.resolve([]);
  }
  const promiseResults = await Promise.allSettled(promises);
  const failed = [];
  const result = [];
  for (const promiseResult of promiseResults) {
    if (promiseResult.status === "rejected") {
      failed.push(promiseResult.reason);
    } else {
      result.push(promiseResult.value);
    }
  }
  if (failed.length !== 0) {
    throw new WrappedError(
      `${failed.length} promises failed. ${errorMessage}`,
      failed
    );
  }
  return result;
}
