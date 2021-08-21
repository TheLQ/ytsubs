import bent from "bent";
import _ from "lodash";
import moment from "moment";
import asyncPool from "tiny-async-pool";
import {Context} from ".";
import { findOrFail } from "./util/apputil";
import {WrappedError} from "./util/error";
import logger from "./util/logger";
import {GetVideoOptions} from "./util/storage";
import * as youtube from "./util/youtubeUtils";

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
    notUpdatedIn: "-5 hours",
  });

  console.log(`importing ${channels.length} channels`);
  await asyncPool(2, channels, async (entry) => {
    try {
      log.debug(`fetching channel feed ${entry.channelName}`);
      let xmlContent;
      try {
        xmlContent = await getUrl(youtube.feedUrlPrefix + entry.channelId);
      } catch (e) {
        if (e.statusCode === 404) {
          log.error(`404 for channel ${entry.channelId} ${entry.channelName}`);
          return;
        }
        throw e;
      }
      const videos = youtube.parseChannelFeed(xmlContent);
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

export async function downloadSubscriptions(context: Context) {}

export async function checkYoutubeStatus(context: Context) {
  // return youtube.authTest();
}

export async function getVideos(context: Context, options: GetVideoOptions) {
  const videosRaw = await context.db.getVideos({
    ...options,
    limit: 100,
  });

  return videosRaw.map((entry: any) => {
    entry.publishedRelative = moment(entry.published).fromNow();
    return entry;
  });
}

export async function getSubscriptions(context: Context) {
  const groups = await context.db.getChannelGroups();
  const subscriptionsRaw = await context.db.getSubscriptions();

  return subscriptionsRaw.map((entry) => {
    if (entry.groups) {
      entry.groupsInfo = entry.groups.split(",").map(groupNeedle => findOrFail(groups, e => e.groupName == groupNeedle));
    }
    return entry;
  });
}
