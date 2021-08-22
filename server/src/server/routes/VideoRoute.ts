import express from "express";
import * as api from "../api";
import { Context } from "../index";
import { loadTemplate } from "../templates";
import { parseForm } from "../util/apputil";
import logger from "../util/logger";
import { GetVideoOptions } from "../util/storage";
import { doDebugWork } from "./DebugRoute";

const log = logger("server/routes/VideoRoute");

export async function getVideos(
  req: express.Request,
  res: express.Response,
  context: Context,
  messages: string[] = []
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate("videos");

  const videos = await context.db.getVideos(req.query as GetVideoOptions);

  res.send(
    template({
      groups: await context.db.getChannelGroups(),
      messages,
      videos,
    })
  );
}

export async function postVideos(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const formData = await parseForm(req);
  const messages: string[] = [];

  if (formData.fields.downloadFeeds !== undefined) {
    await api.downloadVideosRSS(context, messages);
  } else {
    await doDebugWork(formData.fields);
  }

  return getVideos(req, res, context, messages);
}
