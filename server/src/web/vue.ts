import Vue from "vue";
import App from "./components/App.vue";
import { VideoStorage } from "../server/util/storage";

export interface IVueData {
  videos: VideoStorage[];
  youtube: IYoutube;
}

interface IYoutube {
  signedIn: boolean;
}

export function initView() {
  console.log("loading Vue");
  const vueRoot = new Vue<IVueData>({
    data: {
      videos: [],
      youtube: {
        signedIn: false
      }
    },
    el: "#vueapp",
    render: h => h(App)
  });

  console.log("done loading Vue");
  return vueRoot;
}
