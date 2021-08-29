import { ARG_GROUP_NAME } from "./ApiGroupRoute";

export const ARG_CHANNEL_ID = "channelId";

export const GET_API_CHANNEL = "/api/channel";

export const API_CHANNEL_GROUP = `/api/channel/:${ARG_CHANNEL_ID}/group/:${ARG_GROUP_NAME}`;
export function apiChannelGroup(channelId: string, groupName: string) {
  return API_CHANNEL_GROUP.replace(":" + ARG_CHANNEL_ID, channelId).replace(
    ":" + ARG_GROUP_NAME,
    groupName
  );
}
