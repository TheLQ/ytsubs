<template>
  <div class="video-container">
    <Video v-for="video in videos" :key="video.id" :videoItem="video" />
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from "vue";
import Video from "./Video.vue";
import Youtube from "./Youtube.vue";
import { IVueData } from "../vue";
import { Moment } from "moment";

export interface IVideo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  authorUrl: string;
  videoUrl: string;
  published: string;
  publishedMoment: Moment;
}

export default Vue.extend<
  {
    videos: IVideo[];
  },
  {},
  {},
  {}
>({
  components: {
    Video
  }
});
</script>
