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

const log = logger("server/routes/ApiYoutubeRoute");
const getUrl = bent("string");

export async function postYoutubeChannels(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const formData = await parseForm(req);

  const subs = parseSubscriptionsOpml(formData.memoryFile.toString("utf8"));
  await context.db.addSubscriptions(subs);
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
