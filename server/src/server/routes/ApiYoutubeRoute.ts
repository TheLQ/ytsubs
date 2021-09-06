import express from "express";
import { Context } from "..";
import logger from "../util/logger";
import { WrappedError } from "../../common/util/error";
import bent from "bent";
import asyncPool from "tiny-async-pool";
import { parseForm } from "../util/apputil";
import {
  parseSubscriptionsOpml,
  parseChannelFeed,
  feedUrlPrefix,
} from "../util/youtubeUtils";
import { SubscriptionStorageSimple } from "../../common/util/storage";
import { assertNotBlank, assertNotNull } from "../../common/util/langutils";
import fs from "fs";

const log = logger("server/routes/ApiYoutubeRoute");
const getUrl = bent("string");

export async function postYoutubeChannels(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  let subs: SubscriptionStorageSimple[];
  if (req.query.gapi == "") {
    const gapiSubs = req.body as gapi.client.youtube.Subscription[];
    console.log("handling gapi for " + gapiSubs.length);
    subs = [];
    for (const sub of gapiSubs) {
      let errorMessage = " missing in " + JSON.stringify(sub);
      const channelId = assertNotBlank(
        sub.snippet?.resourceId?.channelId,
        "id" + errorMessage
      );
      errorMessage = " in channel " + channelId + errorMessage;

      log.debug("Writing cache for " + channelId);
      await fs.promises.writeFile(
        `cache_gapi/${channelId}.json`,
        JSON.stringify(sub)
      );

      subs.push({
        // snippet.channelId is us vs resource which is the target's channel id
        channelId,
        channelName: assertNotBlank(sub.snippet?.title, "name" + errorMessage),
        // description can be empty bue at least exists
        channelDescription: assertNotNull(
          sub.snippet?.description,
          "description" + errorMessage
        ),
        thumbnailDefault: assertNotBlank(
          sub.snippet?.thumbnails?.default?.url,
          "name" + errorMessage
        ),
        thumbnailHigh: assertNotBlank(
          sub.snippet?.thumbnails?.high?.url,
          "name" + errorMessage
        ),
        thumbnailMedium: assertNotBlank(
          sub.snippet?.thumbnails?.medium?.url,
          "name" + errorMessage
        ),
      });
    }
  } else if (req.query.opml == "") {
    console.log("handling opml");
    const formData = await parseForm(req);
    subs = parseSubscriptionsOpml(formData.memoryFile.toString("utf8"));
  } else {
    res.status(500);
    res.end("FAIL");
    return;
  }

  await context.db.addSubscriptions(subs);
  res.end("{}");
}

export async function postYoutubeChannelsUpdate(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const logs: string[] = [];
  await downloadVideosRSS(context, logs);

  res.send(`<a href="${req.headers.referer}">Go back</a>`);
  logs.forEach((e) => res.send("<br/>" + e));
  res.end();
}

/**
 * Download latest videos via RSS feeds
 * @param context
 * @param messages
 */
export async function downloadVideosRSS(context: Context, messages: string[]) {
  messages.push("imported videos");
  const channels = await context.db.getSubscriptions({
    notUpdatedIn: "-5 hours",
  });

  console.log(`importing ${channels.length} channels`);
  await asyncPool(2, channels, async (entry) => {
    try {
      log.debug(`fetching channel feed ${entry.channelName}`);
      let xmlContent;
      try {
        xmlContent = await getUrl(feedUrlPrefix + entry.channelId);
      } catch (e: any) {
        if (e.statusCode && e.statusCode === 404) {
          log.error(`404 for channel ${entry.channelId} ${entry.channelName}`);
          return;
        }
        throw e;
      }
      const videos = parseChannelFeed(xmlContent);
      if (videos.length === 0) {
        // empty channel
        return;
      }
      await context.db.addVideos(videos);
      await context.db.setSubscriptionsUpdated([videos[0].channelId]);
    } catch (e) {
      throw new WrappedError(
        `failed to load channel ${entry.channelId} ${entry.channelName}`,
        e
      );
    }
  });
}
