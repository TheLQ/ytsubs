import express from "express";
import fs from "fs";
import { deleteApiGroupChannel, postApiGroupAdd, postApiGroupChannel, postApiGroupColor } from "./routes/ApiGroupRoute";
import { postYoutubeSubscriptions } from "./routes/ApiYoutubeRoute";
import { getSubscription, postSubscription } from "./routes/SubscriptionsRoute";
import { getVideos, postVideos } from "./routes/VideoRoute";
import { initHandlebars } from "./templates";
import * as error from "./util/error";
import logger from "./util/logger";
import { Storage } from "./util/storage";
import { parseSubscriptionsOpml } from "./util/youtubeUtils";

const log = logger("server");
log.info("Starting app");

async function init() {
  try {
    const app = express();
    const port = 3000;

    const context = await Context.create();

    await initHandlebars();

    app.use("/client", express.static("dist/client"));
    app.use("/src", express.static("src"));

    app.get("/", prehandle(getVideos, context));
    app.post("/", prehandle(postVideos, context));

    app.get("/subscriptions", prehandle(getSubscription, context));
    app.post("/subscriptions", prehandle(postSubscription, context));

    app.get("/subscriptions", prehandle(getSubscription, context));
    app.post("/subscriptions", prehandle(postSubscription, context));

    app.post("/api/group/add", prehandle(postApiGroupAdd, context));
    app.post("/api/group/color", prehandle(postApiGroupColor, context));
    app.post("/api/group/channel", prehandle(postApiGroupChannel, context));
    app.delete("/api/group/channel", prehandle(deleteApiGroupChannel, context));

    app.post("/api/youtube/subscriptions", prehandle(postYoutubeSubscriptions, context))

    const bindAddress = process.env.USER === "dev" ? "0.0.0.0" : "127.0.0.1";
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

type UwsCallback = (
  req: express.Request,
  res: express.Response,
  context: Context
) => any;

export function prehandle(callback: UwsCallback, context: Context) {
  return async function _prehandle(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    log.http(`-- ${req.method} ${req.url}`);
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
  public static async create() {
    const ctx = new Context(await Storage.create("./client/database.sqlite"));

    if ((await ctx.db.getSubscriptionsSimple()).length === 0) {
      log.info("first run, loading subscriptions");
      const contentXml = await fs.promises.readFile(
        "client/subscription_manager.xml",
        "utf8"
      );
      await ctx.db.addSubscriptions(parseSubscriptionsOpml(contentXml));
    }
    return ctx;
  }

  public db: Storage;

  private constructor(db: Storage) {
    this.db = db;
  }
}