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

  const videos = await context.db.getVideos({
    limit: 100,
    groups: body.groups,
  });
  res.type("json");
  res.end(JSON.stringify(videos));
}
