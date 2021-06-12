import { WrappedError } from "./error";
import formidable from "formidable";
import express from "express";

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
    //form.multiples = true;

    // Do not unnecessarily write xml/json to disk, just to read it back and delete
    let memoryFile = Buffer.of();
    if (inMemoryFiles) {
      form.onPart = function(part) {
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
        memoryFile
      });
    });
  });
}
