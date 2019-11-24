<template>
  <div class="app">
    <Youtube />
    <Videos />
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from "vue";
import Video from "./Video.vue";
import Youtube from "./Youtube.vue";
import { IVueData } from "../vue";

export default Vue.extend<
  {
    name: string;
  },
  {},
  {},
  {}
>({
  components: {
    Video,
    Youtube
  },
  data: function() {
    const vueData = this.$root.$data as IVueData;
    return {
      videos: vueData.videos
    };
  }
});
</script>
