export const GROUP_MAGIC_NONE = "(none)";

export interface VideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

export interface SubscriptionStorageSimple {
  channelId: string;
  channelName: string;
  lastUpdated?: string;
  thumbnailMedium?: string;
  thumbnailDefault?: string;
  thumbnailHigh?: string;
  channelDescription?: string;
}

export interface SubscriptionStorage extends SubscriptionStorageSimple {
  groups?: string;
}

export interface ChannelGroup {
  groupName: string;
  color: string | null;
}

export interface ChannelGroupMapping {
  channelId: string;
  groupName: string;
}

export interface GetChannelOptions {
  notUpdatedIn?: string;
}

/* getVideos */

export interface GetVideoOptions {
  groups?: GroupFilter[];
  channelId?: string;
  limit?: number;
  publishedAfter?: string;
}

export interface GroupFilter {
  name: string;
  included: boolean;
}

export interface GetVideosResult extends SubscriptionStorage, VideoStorage {
  publishedRelative: string;
}
