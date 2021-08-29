import express from "express";
import { Context } from "..";
import { VideosRequest } from "../../common/routes/ApiVideosRoute";

export async function postApiVideos(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const body = req.body as VideosRequest;
  console.log("body", body);

  body.limit = 100;

  const videos = await context.db.getVideos(body);
  res.type("json");
  res.end(JSON.stringify(videos));
}
