import express from "express";
import fs from "fs";
import {
  getApiGroup,
  putApiGroup,
  putApiGroupColor,
} from "./routes/ApiGroupRoute";
import {
  API_GROUP,
  API_GROUP_COLOR,
  GET_API_GROUP,
} from "../common/routes/ApiGroupRoute";
import {
  getApiChannel,
  putApiChannelGroup,
  deleteApiChannelGroup,
} from "./routes/ApiChannelRoute";
import {
  API_CHANNEL_GROUP,
  GET_API_CHANNEL,
} from "../common/routes/ApiChannelRoute";
import { POST_API_VIDEOS } from "../common/routes/ApiVideosRoute";
import { postApiVideos } from "./routes/ApiVideosRoute";
import {
  postYoutubeChannels,
  postYoutubeChannelsUpdate,
} from "./routes/ApiYoutubeRoute";
import * as error from "../common/util/error";
import logger from "./util/logger";
import { Storage } from "./storage";
import { parseSubscriptionsOpml } from "./util/youtubeUtils";
import {
  POST_YOUTUBE_CHANNELS,
  POST_YOUTUBE_CHANNELS_UPDATE,
} from "../common/routes/ApiYoutubeRoute";
import { sleep } from "../common/util/langutils";

const log = logger("server");
log.info("Starting app");

async function init() {
  try {
    const app = express();
    const port = 3001;

    const context = await Context.create();

    app.use(express.json());

    app.use(express.static("../client/dist"));
    // app.use("/client", express.static("dist/client"));
    // app.use("/src", express.static("src"));

    app.options("/*", prehandle(optionsCors, context));

    app.get(GET_API_GROUP, prehandle(getApiGroup, context));
    app.put(API_GROUP, prehandle(putApiGroup, context));
    app.put(API_GROUP_COLOR, prehandle(putApiGroupColor, context));

    app.post(POST_YOUTUBE_CHANNELS, prehandle(postYoutubeChannels, context));
    app.post(
      POST_YOUTUBE_CHANNELS_UPDATE,
      prehandle(postYoutubeChannelsUpdate, context)
    );

    app.post(POST_API_VIDEOS, prehandle(postApiVideos, context));

    app.get(GET_API_CHANNEL, prehandle(getApiChannel, context));
    app.put(API_CHANNEL_GROUP, prehandle(putApiChannelGroup, context));
    app.delete(API_CHANNEL_GROUP, prehandle(deleteApiChannelGroup, context));

    // Debug print all the routes
    app._router.stack.forEach(function (r: any) {
      if (r.route && r.route.path) {
        console.log(r.route.stack[0].method + "\t" + r.route.path);
      }
    });

    // Handle 404 - Keep this as a last route
    app.use(function (req, res, next) {
      setCors(res);
      res.status(404);
      res.end();
    });

    const bindAddress =
      process.env.USER === "dev" || true ? "0.0.0.0" : "127.0.0.1";
    app.listen(port, bindAddress, () => {
      console.log(`Example app listening at http://${bindAddress}:${port}`);
    });
  } catch (e) {
    fatalError(e, "failed to init");
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
    // if (req.method != "OPTIONS") {
    //   await sleep(4000);
    // }
    try {
      setCors(res);

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

export function optionsCors(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  setCors(res);
  res.end();
}

function setCors(res: express.Response) {
  // Allow the dev web server to connect to this backend server
  // TODO: Set origin to be less restrictive...
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, PUT");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
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

// TODO: Avoid importing exit (from process) in client js
const EXIT_FATAL = 5;
export function fatalError(err: any, msg?: string): void {
  if (err instanceof error.WrappedError) {
    console.log(err.toString());
  } else {
    console.log(err);
  }

  if (typeof msg !== "undefined") {
    console.log(msg);
  }
  process.exit(EXIT_FATAL);
}
