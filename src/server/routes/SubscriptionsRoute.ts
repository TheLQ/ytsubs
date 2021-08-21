import express from "express";
import * as api from "../api";
import { Context } from "../index";
import { loadTemplate } from "../templates";
import { parseForm } from "../util/apputil";
import logger from "../util/logger";
import { parseSubscriptionsOpml } from "../util/youtubeUtils";
import { doDebugWork } from "./DebugRoute";

const log = logger("server/routes/SubscriptionsRoute");

export async function getSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template = await loadTemplate("subscriptions");

  const subscriptions = await api.getSubscriptions(context);
  const groups = await context.db.getChannelGroups();

  // log.debug(JSON.stringify(subscriptions));

  res.send(
    template({
      groups,
      subscriptions,
    })
  );
}

export async function postSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const formData = await parseForm(req);

  if (formData.fields.uploadSubscriptions !== undefined) {
    const subs = parseSubscriptionsOpml(formData.memoryFile.toString("utf8"));
    await context.db.addSubscriptions(subs);
  } else if (formData.fields.addGroup !== undefined) {
    await context.db.addChannelGroups([
      { groupName: formData.fields.groupName as string, color: null },
    ]);
  } else if (formData.fields.addChannelGroup !== undefined) {
    await context.db.addChannelGroupMapping([
      {
        channelId: formData.fields.channelId as string,
        groupName: formData.fields.groupName as string,
      },
    ]);
    res.send("added group to channel")
    return
  } else if (formData.fields.syncSubscriptions !== undefined) {
    const url = await api.checkYoutubeStatus(context);
    res.send(url);
    return;
  } else if (formData.fields.setGroupColor !== undefined) {
    let color: string = formData.fields.color as string
    color = color.substr(1)
    await context.db.setGroupColor(formData.fields.groupName as string, color)
    res.end("applied color " + color + " to " + formData.fields.groupName)
    return;
  } else {
    await doDebugWork(formData.fields);
  }

  return getSubscription(req, res, context);
}
