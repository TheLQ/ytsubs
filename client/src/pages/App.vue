<template>
  <header>
    <h1>ytsubs</h1>

    <nav>
      <router-link to="/">Videos</router-link>
      <span>|</span>
      <router-link to="/channels">Channels</router-link>
    </nav>

    <div class="user">
      <template v-if="youtube.signedIn">
        <img :src="youtube.profileImage"/>
        {{ youtube.name }}
      </template>
      <template v-else>
        <label for="signInButton">Sign in with YouTube to manage your channels</label>
      </template>

      <button type="button" id="signInButton" @click="youtubeSignInToggle">
          <template v-if="youtube.signedIn">Sign Out</template>
          <template v-else>Sign In</template>
        </button>
    </div>
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
import { revokeAccess, toggleSignIn } from "../YoutubeManager";

export default defineComponent({
  name: "App",
  components: {
    VideosPage,
    ChannelsPage,
  },
  computed: {
    youtube() {
      return this.$store.state.youtube
    }
  },
  beforeCreate() {
    const store = useStore();
    store.dispatch(ActionTypes.GROUPS_LOAD, "Loading groups");
  },
  methods: {
    /**
     * Yotube Controls form - Sign in/out
     */
    youtubeSignInToggle() {
      toggleSignIn();
    },
    /**
     * Yotube Controls form - Delete account
     */
    youtubeDeleteAccount() {
      revokeAccess();
    },
  }
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

header nav {
  display: inline;
}

header .router-link-active {
  height: 100%;
  background-color: lightgray;
}

header .user {
  float: right;
}

#content {
  display: flex;
  flex-wrap: wrap;
}
</style>
