import { createApp } from "vue";
import App from "./components/App.vue";
import VideosPage from "./components/VideosPage.vue";
import ChannelsPage from "./components/ChannelsPage.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: VideosPage },
    { path: "/channels", component: ChannelsPage },
  ],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
