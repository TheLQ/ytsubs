import express from "express";
import { Context } from "..";

export const GET_API_SUBSCRIPTIONS = "/api/subscriptions";
export async function getApiSubscriptions(
  req: express.Request,
  res: express.Response,
  context: Context
): Promise<void> {
  const subscriptions = await context.db.getSubscriptions();
  res.type("json");
  res.end(JSON.stringify(subscriptions));
}
