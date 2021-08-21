import { initView, IVueData } from "./vue";
import { youtubeInit } from "./youtubeApi";

function init() {
  const vueRoot = initView();
  const vueData: IVueData = vueRoot.$data as IVueData;

  // initSubscriptions(app);
  // gapi.load("client:auth2", () => {
  //   try {
  //     youtubeInit(vueData);
  //   } catch (error) {
  //     console.error("failed to init gapi", error);
  //     return;
  //   }
  // });
}
window.addEventListener("load", init);
