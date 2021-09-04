/**
 * Dedicated JS-lang only utils. Do not import things that via transitive dependencies don't work on the client
 */
import { WrappedError } from "./error";

/**
 * Promise.allSettled that throws a WrappedError, avoiding silent failures
 */
export async function promiseAllThrow<T>(
  promises: Array<Promise<T>>,
  errorMessage: string
): Promise<T[]> {
  if (promises.length === 0) {
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

export function findOrFail<T>(
  arr: Array<T>,
  predicate: (entry: T) => boolean
): T {
  const res = arr.find(predicate);
  if (res == undefined) {
    console.error("failing array", arr);
    throw new Error("Not found " + JSON.stringify(arr));
  }
  return res;
}

export function findIndexOrFail<T>(
  arr: Array<T>,
  predicate: (entry: T) => boolean
): number {
  const res = arr.findIndex(predicate);
  if (res == -1) {
    console.error("failing array " + JSON.stringify(arr));
    throw new Error("Not found");
  }
  return res;
}

export function removeOrFail<T>(
  arr: Array<T>,
  predicate: (entry: T) => boolean
): void {
  const index = findIndexOrFail(arr, predicate);
  arr.splice(index, 1);
}

export function stringSort(a: string, b: string) {
  const nameA = a.toUpperCase();
  const nameB = b.toUpperCase();

  // Because yes Javascript this makes sense
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}
