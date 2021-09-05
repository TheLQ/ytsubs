import express from "express";
import { Context } from "..";
import { ARG_GROUP_NAME, ARG_COLOR } from "../../common/routes/ApiGroupRoute";

export async function getApiGroup(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const result = await context.db.getChannelGroups();

  res.type("json");
  res.end(JSON.stringify(result));
}

export async function putApiGroup(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const groupName = req.params[ARG_GROUP_NAME];

  await context.db.addChannelGroup(groupName);
  res.end("1");
}

export async function deleteApiGroup(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const groupName = req.params[ARG_GROUP_NAME];

  await context.db.removeChannelGroup(groupName);
  res.end("1");
}

export async function putApiGroupColor(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const groupName = req.params[ARG_GROUP_NAME];
  const color = req.params[ARG_COLOR];

  await context.db.setGroupColor(groupName, color);
  res.end("1");
}
