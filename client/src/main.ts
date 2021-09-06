import { createApp } from "vue";
import App from "./pages/App.vue";
import VideosPage from "./pages/VideosPage.vue";
import ChannelsPage from "./pages/ChannelsPage.vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { store, storeKey } from "./VueStore";
import { init } from "./YoutubeManager";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: VideosPage },
    { path: "/channels", component: ChannelsPage },
  ],
});

const app = createApp(App);
app.use(router);
app.use(store, storeKey);
app.mount("#app");

init(store);
