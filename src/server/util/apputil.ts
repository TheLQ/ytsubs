import express from "express";
import formidable from "formidable";
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

interface FormData {
  fields: formidable.Fields;
  files: formidable.Files;
  memoryFile: Buffer;
}

export function parseForm(
  req: express.Request,
  inMemoryFiles = true
): Promise<FormData> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    // form.multiples = true;

    // Do not unnecessarily write xml/json to disk, just to read it back and delete
    let memoryFile = Buffer.of();
    if (inMemoryFiles) {
      form.onPart = function onPartHandler(part) {
        // let formidable handle only non-file parts
        if (part.filename === "" || !part.mime) {
          // used internally, please do not override!
          form.handlePart(part);
        }
        part.on("data", (buffer: Buffer) => {
          memoryFile = Buffer.concat([memoryFile, buffer]);
        });
      };
    }

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      resolve({
        fields,
        files,
        memoryFile,
      });
    });
  });
}

export function findOrFail<T>(arr: Array<T>, predicate: (entry: T) => boolean): T {
  const res = arr.find(predicate)
  if (res == undefined) {
    throw new Error("Not found")
  }
  return res;
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
