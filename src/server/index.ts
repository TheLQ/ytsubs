import express from "express";
import logger from "./util/logger";
import * as error from "./util/error";
import { getVideos, postVideos } from "./routes/VideoRoute";
import { Storage } from "./util/storage";
import { getSubscription, postSubscription } from "./routes/SubscriptionsRoute";
import { initHandlebars } from "./templates";
import fs from "fs";
import { parseSubscriptionsOpml } from "./util/youtubeUtils";
import { getApi, postApi } from "./routes/ApiRoute";

const log = logger("server");
log.info("Starting app");

async function init() {
  try {
    const app = express();
    const port = 3000;

    const context = new Context();
    await context.init();

    await initHandlebars();

    app.use("/client", express.static("dist/client"));

    app.get("/", prehandle(getVideos, context));
    app.post("/", prehandle(postVideos, context));

    app.get("/subscriptions", prehandle(getSubscription, context));
    app.post("/subscriptions", prehandle(postSubscription, context));

    app.get("/subscriptions", prehandle(getSubscription, context));
    app.post("/subscriptions", prehandle(postSubscription, context));

    app.get("/api/*", prehandle(getApi, context));
    app.post("/api/*", prehandle(postApi, context));

    let bindAddress = (process.env.USER == "dev") ? "0.0.0.0" : "127.0.0.1"
    app.listen(port, bindAddress, () => {
      console.log(`Example app listening at http://${bindAddress}:${port}`);
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
      res.send(`<pre>${message}</pre>`);
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

    if ((await this.db.getSubscriptionsSimple()).length == 0) {
      log.info("first run, loading subscriptions");
      const contentXml = await fs.promises.readFile(
        "client/subscription_manager.xml",
        "utf8"
      );
      this.db.addSubscriptions(parseSubscriptionsOpml(contentXml));
    }
  }
}
