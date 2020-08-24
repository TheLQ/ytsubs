import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";

const log = logger("server/routes/VideoRoute");

export default async function getVideos(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate("videos");

  res.send(JSON.stringify(await context.db.getVideos()));
}
