import express from "express";
import { Context } from "..";
import { parseForm } from "../util/apputil";

export async function postApiGroupColor(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const formData = await parseForm(req);

  let color: string = formData.fields.color as string
  color = color.substr(1)

  await context.db.setGroupColor(formData.fields.groupName as string, color)

  res.end(`applied color ${color} to group ${formData.fields.groupName}`)
}

export async function postApiGroupAdd(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const formData = await parseForm(req);

  const groupName = formData.fields.groupName as string
  await context.db.addChannelGroups([
    { groupName, color: null },
  ]);
  res.end(`Created new group ${groupName}`)
}

export async function postApiGroupChannel(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const formData = await parseForm(req);

  const channelId = formData.fields.channelId as string
  const groupName = formData.fields.groupName as string
  await context.db.addChannelGroupMapping([
    {
      channelId,
      groupName,
    },
  ]);
  res.end(`added group ${groupName} to channel ${channelId}`)
}

export async function deleteApiGroupChannel(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const formData = await parseForm(req);

  const channelId = formData.fields.channelId as string
  const groupName = formData.fields.groupName as string
  await context.db.removeChannelGroupMapping([
    {
      channelId,
      groupName,
    },
  ]);
  res.end(`remove group ${groupName} from channel ${channelId}`)
}
