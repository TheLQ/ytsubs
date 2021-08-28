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

export interface GetVideoOptions {
  group?: string;
  channelId?: string;
  limit?: number;
}

export interface GetChannelOptions {
  notUpdatedIn?: string;
}

export interface GetVideosResult extends SubscriptionStorage, VideoStorage {
  publishedRelative: string;
}
