import logger from "../util/logger";
import { loadTemplate, Lazy } from "../templates";
import express from "express";
import { Context } from "../index";

const log = logger("server/routes/ItemRoute");

const template: Lazy<HandlebarsTemplateDelegate> = loadTemplate("videos");

export default async function getVideos(
  req: express.Request,
  res: express.Response,
  context: Context
): void {
  res.send(JSON.stringify(await context.db.getVideos()));
}
