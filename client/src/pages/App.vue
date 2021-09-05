<template>
  <header>
    <h1>ytsubs</h1>

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
import GroupSelector from "../components/GroupSelector.vue";
import GroupsDisplay from "../components/GroupsDisplay.vue";
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

header h1 {
  display: inline;
  margin: 20px;
}

header .router-link-active {
  height: 100%;
  background-color: lightgray;
}

header nav {
  display: inline;
}

#content {
  display: flex;
  flex-wrap: wrap;
}
</style>
