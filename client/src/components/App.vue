<template>
  <header>
    <h1 id="appname">ytsubs</h1>

    <nav>
      <router-link to="/">Videos</router-link>
      <span>|</span>
      <router-link to="/channels">Channels</router-link>
    </nav>
  </header>
  <div id="content">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import VideosPage from "./VideosPage.vue";
import ChannelsPage from "./ChannelsPage.vue";
import GroupSelector from "./GroupSelector.vue";
import GroupsDisplay from "./GroupsDisplay.vue";
import { ActionTypes, MutationTypes, useStore } from "../VueStore";

export default defineComponent({
  name: "App",
  components: {
    VideosPage,
    ChannelsPage,
    GroupsDisplay,
    GroupSelector,
  },
  beforeCreate() {
    const store = useStore();
    store.dispatch(ActionTypes.GROUPS_LOAD, "Loading groups");
  },
});
</script>

<style>
header {
  background-color: gray;
}

header #appname {
  display: inline;
  margin: 20px;
}

header .router-link-active {
  height: 100%;
  background-color: lightgray;
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
