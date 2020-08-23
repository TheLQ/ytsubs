import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";
import formidable, { IncomingForm } from "formidable";

const log = logger("server/routes/ItemRoute");

export async function getSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate(
    "subscriptions"
  );

  res.send(JSON.stringify(await context.db.getVideos()));
}

export async function postSubscription(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const form = formidable({ multiples: true }) as IncomingForm;
  form.parse(req, (err, fields, files) => {
    if (err) {
      throw err;
    }
    res.json({ fields, files });
  });
}
