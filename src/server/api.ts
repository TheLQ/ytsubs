import logger from "./util/logger";
import { Context } from ".";
import * as youtube from "./util/youtubeUtils";
import asyncPool from "tiny-async-pool";
import { WrappedError } from "./util/error";
import bent from "bent";
import { GetVideoOptions } from "./util/storage";
import moment from "moment";

const getUrl = bent("string");
const log = logger("server/api");

/**
 * Download latest videos via RSS feeds
 * @param context
 * @param messages
 */
export async function downloadVideosRSS(context: Context, messages: string[]) {
  messages.push("imported videos");
  const channels = await context.db.getSubscriptions({
    notUpdatedIn: "-5 hours"
  });

  console.log(`importing ${channels.length} channels`);
  await asyncPool(2, channels, async entry => {
    try {
      log.debug(`fetching channel feed ${entry.channelName}`);
      let xmlContent;
      try {
        xmlContent = await getUrl(youtube.feedUrlPrefix + entry.channelId);
      } catch (e) {
        if (e.statusCode == 404) {
          log.error(`404 for channel ${entry.channelId} ${entry.channelName}`);
          return;
        }
        throw e;
      }
      const videos = youtube.parseChannelFeed(xmlContent);
      if (videos.length == 0) {
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

export async function downloadSubscriptions(context: Context) {}

export async function checkYoutubeStatus(context: Context) {
  // return youtube.authTest();
}

export async function getVideos(context: Context, options: GetVideoOptions) {
  let videosRaw = await context.db.getVideos({
    ...options,
    limit: 100
  });

  let videos = videosRaw.map((entry: any) => {
    entry.publishedRelative = moment(entry.published).fromNow();
    return entry;
  });

  return videos;
}

export async function getSubscriptions(context: Context) {
  const subscriptionsRaw = await context.db.getSubscriptions();

  const subscriptions = subscriptionsRaw.map(entry => {
    if (entry.groups) {
      entry.groupsArray = entry.groups.split(",");
    }
    return entry;
  });

  return subscriptions;
}
