import Vue from "vue";
import App from "./components/App.vue";

export interface IVueData {
  videos: IVideo[];
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
    el: "#app",
    render: h => h(App)
  });

  console.log("done loading Vue");
  return vueRoot;
}
