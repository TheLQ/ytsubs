import express from "express";
import { Context } from "..";

export const GET_API_VIDEOS = "/api/videos"
export async function getApiVideos(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const videos = await context.db.getVideos({
    limit: 100
  })
  res.type("json")
  res.end(JSON.stringify(videos))
}
