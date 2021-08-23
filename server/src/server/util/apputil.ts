import express from "express";
import formidable from "formidable";


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
