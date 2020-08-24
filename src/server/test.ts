import fs from "fs";
import { parseChannelFeed } from "./util/youtube";

fs.readFile("cache_feed/UC-7XY-W_C84cW2MNqujgFpg.xml", "utf8", (err, data) => {
  const res = parseChannelFeed(data);
  console.log(res);
});
