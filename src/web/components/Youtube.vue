<template>
  <div class="youtube">
    <button v-on:click="login" v-if="!isLoggedIn">Sign in</button>
    <button v-on:click="logout" v-if="isLoggedIn">Sign out</button>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { IVueData } from "../vue";

export default Vue.extend<
  {
    isLoggedIn: boolean;
  },
  {},
  {},
  {}
>({
  data: function() {
    console.log("youtube data");
    const vueData = this.$d as IVueData;
    return {
      isLoggedIn: vueData.youtube.signedIn
    };
  },
  methods: {
    login: function() {
      console.log("login");
      const vueData = this.$root.$data as IVueData;
      console.log("vueData", vueData);
      vueData.youtube.signedIn = true;
    },
    logout: function() {
      console.log("logout");
      const vueData = this.$root.$data as IVueData;
      console.log("vueData", vueData);
      vueData.youtube.signedIn = false;
    }
  }
});
</script>
