<template>
  <nav>
    <h1 id="appname">ytsubs</h1>

    <router-link to="/">Videos</router-link>
    <span>|</span>
    <router-link to="/channels">Channels</router-link>
  </nav>
  <div id="content">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import VideosPage from "./VideosPage.vue";
import ChannelsPage from "./ChannelsPage.vue";

export default defineComponent({
  name: "App",
  components: {
    VideosPage,
    ChannelsPage,
  },
});
</script>

<style>
#appname {
  display: inline;
}

#app {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

#content {
  display: flex;
  flex-wrap: wrap;
}
</style>
