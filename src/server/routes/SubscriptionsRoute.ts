import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";
import { doDebugWork } from "./DebugRoute";
import { parseForm } from "../util/apputil";

const log = logger("server/routes/ItemRoute");

export async function getSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate(
    "subscriptions"
  );

  res.send(
    template({
      subscriptions: []
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
    console.log("subscriptions!");
    console.log(formData.memoryFile);
  } else {
    await doDebugWork(formData.fields);
  }

  return getSubscription(req, res, context);
}
