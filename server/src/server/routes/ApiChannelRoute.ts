import express from "express";
import { Context } from "..";
import { ARG_CHANNEL_ID } from "../../common/routes/ApiChannelRoute";
import { ARG_GROUP_NAME } from "../../common/routes/ApiGroupRoute";

export async function getApiChannel(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const subscriptions = await context.db.getSubscriptions();
  res.type("json");
  res.end(JSON.stringify(subscriptions));
}

export async function putApiChannelGroup(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const channelId = req.params[ARG_CHANNEL_ID];
  const groupName = req.params[ARG_GROUP_NAME];
  await context.db.addChannelGroupMapping([
    {
      channelId,
      groupName,
    },
  ]);

  // res.end(`added group ${groupName} to channel ${channelId}`)
  res.end("1");
}

export async function deleteApiChannelGroup(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const channelId = req.params[ARG_CHANNEL_ID];
  const groupName = req.params[ARG_GROUP_NAME];

  await context.db.removeChannelGroupMapping([
    {
      channelId,
      groupName,
    },
  ]);
  //res.end(`remove group ${groupName} from channel ${channelId}`)
  res.end("1");
}
