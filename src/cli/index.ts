// import * as utils from '../utils'
// import * as fs from 'fs'

// fs.readFile(
//     '/big10/projects/ytsubs/cache_feed/UC0iDKgdHXQNmh2cuvEUZhDw.xml',
//     /*return string instead of buffer*/"utf8",
//     function processClientSecrets(err, content) {
//         utils.loadXml(content);
//     }
// )

import http from "http";
import * as DownloadUtils from "../utils/downloadUtils";
import * as Subscriptions from "../web/subscriptions";

const feedUrls = Subscriptions.channels.map(
  channelId => "http://127.0.0.1:8080/cache_feed/" + channelId + ".xml"
);

function getUrlNode(url: string, callback: DownloadUtils.GetUrlCallback) {
  http
    .get(url, res => {
      let body = "";
      res.on("data", chunk => {
        body += chunk;
      });
      res.on("end", () => {
        callback(url, body);
      });
    })
    .on("error", e => {
      throw e;
    });
}

DownloadUtils.getUrlMultiple(
  getUrlNode,
  5,
  feedUrls,
  (url, body) => {
    console.log("got it " + url);
  },
  () => {
      console.log("done");
  }
);
