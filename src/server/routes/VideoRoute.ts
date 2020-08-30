import logger from "../util/logger";
import { loadTemplate } from "../templates";
import express from "express";
import { Context } from "../index";
import { parseForm } from "../util/apputil";
import { doDebugWork } from "./DebugRoute";
import * as api from "../api";
import { GetVideoOptions } from "../util/storage";

const log = logger("server/routes/VideoRoute");

export async function getVideos(
  req: express.Request,
  res: express.Response,
  context: Context,
  messages: string[] = []
): Promise<void> {
  const template: HandlebarsTemplateDelegate = await loadTemplate("videos");

  const videos = await api.getVideos(context, req.query as GetVideoOptions);

  res.send(
    template({
      videos,
      messages,
      groups: await context.db.getChannelGroups()
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

  if (formData.fields.downloadFeeds != undefined) {
    await api.downloadFeeds(context, messages);
  } else {
    await doDebugWork(formData.fields);
  }

  return getVideos(req, res, context, messages);
}
