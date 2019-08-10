import moment, { Moment } from "moment";
import Vue from "vue";
import * as DownloadUtils from "../utils/downloadUtils";
import * as SortUtils from "../utils/sortUtils";
import * as XmlUtils from "../utils/xmlUtils";
import App from "./components/App.vue";
import * as Subscriptions from "./subscriptions";

function init() {
  const app = initView();
  initSubscriptions(app);
}
window.addEventListener("load", init);

function initView() {
  console.log("loading Vue");
  const app = new Vue({
    data: {
      videos: [],
    },
    el: "#app",
    render: (h) => h(App),
  });

  console.log("done loading Vue");
  return app;
}

export interface IVideo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  authorUrl: string;
  videoUrl: string;
  published: string;
  publishedMoment: Moment;
}

function initSubscriptions(vue: Vue) {
  const videos: IVideo[] = [];

  const feedUrls = Subscriptions.channels.map(
    (channelId) => "/cache_feed/" + channelId + ".xml",
  );

  DownloadUtils.getUrlMultiple(
    DownloadUtils.getUrlWeb,
    5,
    feedUrls,
    function parseUrlResult(url, body) {
      const feed = XmlUtils.loadAtom(body);
      for (const entry of XmlUtils.getElements(feed, "entry")) {
        const media = XmlUtils.getElement(entry, "media:group");
        const authorElem = XmlUtils.getElement(entry, "author");

        const videoId = XmlUtils.getElementText(entry, "yt:videoId");

        const publishedString = XmlUtils.getElementText(entry, "published");
        const publishedMoment = moment(publishedString);

        videos.push({
          author: XmlUtils.getElementText(authorElem, "name"),
          authorUrl: XmlUtils.getElementText(authorElem, "uri"),
          id: XmlUtils.getElementText(entry, "id"),
          published: publishedMoment.format("MMMM Do YYYY"),
          publishedMoment,
          thumbnail: "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg",
          title: XmlUtils.getElementText(media, "media:title"),
          videoUrl: "https://www.youtube.com/watch?v=" + videoId,
        });
      }
    },
    function done() {
      // sort
      SortUtils.sort(
        videos,
        // minus to go in descending order
        (left, right) => -left.publishedMoment.diff(right.publishedMoment),
        0,
        videos.length,
      );

      // don't make a gigantic list that crashes the browser
      // TODO: pagination
      const maxSize = 100;
      videos.splice(maxSize, Number.MAX_VALUE);

      // set in vue
      console.log("videos", videos);
      for (const video of videos) {
        vue.$data.videos.push(video);
      }
    },
  );
}
