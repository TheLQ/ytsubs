<template>
  <div class="video-container">
    <Video v-for="video in videos" :key="video.id" :videoItem="video" />
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from "vue";
import Video from "./Video.vue";

export default Vue.extend<
  {
    name: string;
  },
  {},
  {},
  {}
>({
  components: {
    Video
  },
  data: function() {
    const data = this.$root.$data.videos;
    console.log("videos", data);
    return {
      videos: data
    };
  }
});
</script>
