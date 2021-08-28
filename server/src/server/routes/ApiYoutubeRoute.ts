import express from "express";
import { Context } from "..";
import * as api from "../api";
import { parseForm } from "../util/apputil";
import { parseSubscriptionsOpml } from "../util/youtubeUtils";

export async function postYoutubeSubscriptions(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  const formData = await parseForm(req);

  const subs = parseSubscriptionsOpml(formData.memoryFile.toString("utf8"));
  await context.db.addSubscriptions(subs);
}
