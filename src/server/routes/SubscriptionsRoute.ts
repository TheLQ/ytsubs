import express from "express";
import * as api from "../api";
import { Context } from "../index";
import { loadTemplate } from "../templates";
import { parseForm } from "../util/apputil";
import logger from "../util/logger";
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
  await doDebugWork(formData.fields);

  return getSubscription(req, res, context);
}
