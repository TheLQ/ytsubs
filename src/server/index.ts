import express from "express";
import logger from "./util/logger";
import * as error from "./util/error";
import VideoRoute from "./routes/VideoRoute";
import { Storage } from "../cli/storage";

const log = logger("server");

async function init() {
  try {
    const app = express();
    const port = 3000;

    const context = new Context();
    await context.init();

    app.get("/", prehandle(VideoRoute, context));

    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  } catch (e) {
    error.fatalError(e, "failed to init");
  }
}
/*
 * The init function is quite heavy. Theoretically wait until other stuff is
 * complete before running, including I/O (so don't use process.nextTick)
 *
 * Not sure if this does anything useful though
 */
setImmediate(() => init());

interface uwsCallback {
  (req: express.Request, res: express.Response, context: Context): any;
}

export function prehandle(callback: uwsCallback, context: Context) {
  return async function _prehandle(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    log.http(`-- ${req.url}`);
    try {
      const result = callback(req, res, context);
      if (result instanceof Promise) {
        await result;
      }
    } catch (err) {
      const message = error.prettyError(err);
      res.send(message);
      log.error(err);
    }
  };
}

export class Context {
  public db: Storage;

  public constructor() {
    this.db = (undefined as unknown) as Storage;
  }

  async init() {
    this.db = await Storage.create("./client/database.sqlite");
  }
}
