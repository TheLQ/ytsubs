import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";
import { doDebugWork } from "./DebugRoute";
import { parseForm } from "../util/apputil";
import { parseSubscriptionsOpml } from "../util/youtube";
import { storage } from "googleapis/build/src/apis/storage";
import * as api from "../api";

const log = logger("server/routes/SubscriptionsRoute");

export async function getSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template = await loadTemplate("subscriptions");

  const subscriptions = await api.getSubscriptions(context);
  const groups = await context.db.getChannelGroups();

  log.debug(JSON.stringify(subscriptions));

  res.send(
    template({
      subscriptions,
      groups
    })
  );
}

export async function postSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const formData = await parseForm(req);

  if (formData.fields.uploadSubscriptions != undefined) {
    const subs = parseSubscriptionsOpml(formData.memoryFile.toString("utf8"));
    await context.db.addSubscriptions(subs);
  } else if (formData.fields.addGroup != undefined) {
    await context.db.addChannelGroups([
      { groupName: formData.fields.groupName as string }
    ]);
  } else if (formData.fields.addChannelGroup != undefined) {
    await context.db.addChannelGroupMapping([
      {
        channelId: formData.fields.channelId as string,
        groupName: formData.fields.groupName as string
      }
    ]);
  } else {
    await doDebugWork(formData.fields);
  }

  return getSubscription(req, res, context);
}
