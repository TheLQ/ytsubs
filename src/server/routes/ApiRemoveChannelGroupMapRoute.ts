import { Context } from "../index";
import express from "express";

export async function getRemoveChannelGroupMap(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  await context.db.removeChannelGroupMapping([
    {
      channelId: req.query.channelId as string,
      groupName: req.query.groupName as string
    }
  ]);

  const referer = req.get("Referer");
  if (referer != undefined) {
    res.setHeader("Location", referer);
  }
  res.send("success");
}
