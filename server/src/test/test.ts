import fs from "fs";
import util from "util";

const val = fs.readFileSync("cache_feed/01-get_video_info");
const args = decodeURIComponent(val).split("&").sort();
for (const arg of args) {
  if (arg.startsWith("player_response")) {
    const obj = JSON.parse(arg.substring("player_response=".length));
    console.log(
      "player_response",
      util.inspect(obj, { showHidden: false, depth: null })
    );
  } else {
    console.log(arg);
  }
}
