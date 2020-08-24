import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";
import { doDebugWork } from "./DebugRoute";
import { parseForm } from "../util/apputil";
import { parseSubscriptionsOpml } from "../util/youtube";
import { storage } from "googleapis/build/src/apis/storage";

const log = logger("server/routes/SubscriptionsRoute");

export async function getSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate(
    "subscriptions"
  );

  const subscriptions = await context.db.getSubscriptions();

  res.send(
    template({
      subscriptions
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
  } else {
    await doDebugWork(formData.fields);
  }

  return getSubscription(req, res, context);
}
