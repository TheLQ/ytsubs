import express from "express";
import { Context } from "..";
import * as api from "../api";

export async function getApi(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  if (req.path === "/api/youtube/status") {
    const result = await api.checkYoutubeStatus(context);
    res.send(result);
  } else {
    res.statusCode = 400;
    res.send("Unknown GET " + req.path);
  }
}

export async function postApi(
  req: express.Request,
  res: express.Response,
  context: Context
) {
  res.statusCode = 400;
  res.send("Unknown POST " + req.path);
}
