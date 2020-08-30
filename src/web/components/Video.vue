<template>
  <div class="videoBox">
    <a :href="videoItem.videoUrl">
      <img :src="videoItem.thumbnail" style="float:left" />
      <h3>{{ videoItem.title }}</h3>
    </a>
    <div>
      <a :href="videoItem.authorUrl">{{ videoItem.author }}</a>
    </div>
    <div>{{ videoItem.published }}</div>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from "vue";
import { VideoStorage } from "../../server/util/storage";

export default Vue.extend<
  {},
  {},
  {},
  {
    videoItem: VideoStorage;
  }
>({
  props: {
    videoItem: {}
  }
});
</script>
