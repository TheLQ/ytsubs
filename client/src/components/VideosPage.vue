<template>
  <div id="sidebar">
    <ul>
      <li>
        <a href="/">none</a>
      </li>
      <li v-for="group in groups">
        <a href="/?group={{groupName}}">{{ group.groupName }}</a>
      </li>
      <li>Hey look</li>
      <li>content!</li>
    </ul>
  </div>
  <div id="content">
    <h1>Videos</h1>
    <div class="subscription-box">
      <form action method="POST" enctype="multipart/form-data">
        <button name="downloadFeeds">Download channel feeds</button>
      </form>
    </div>

    <div class="video-container">
      <div class="video-box" v-for="video in videos">
        <a class="video-link" v-bind:href="'https://www.youtube.com/watch?v=' + video.videoId">
          <img v-bind:src="'https://i4.ytimg.com/vi/' + video.videoId + '/mqdefault.jpg'" />
          <h3 class="video-title">{{ video.title }}</h3>
        </a>
        <div class="video-channel-wrapper">
          <a
            class="video-channel"
            v-bind:href="'/?channelId=' + video.channelId"
          >{{ video.channelName }}</a>
        </div>
        <div class="video-published">{{ video.publishedRelative }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue'
import { GetVideosResult, ChannelGroup } from "../../../server/src/server/util/storage"

interface MyData {
  groups: ChannelGroup[],
  videos: GetVideosResult[],
}

export default defineComponent({
  name: 'VideosPage',
  data() {
    return {
      groups: [],
      videos: [],
    } as MyData
  },
  mounted() {
    fetch("http://127.0.0.1:3001/api/videos")
      .then(res => res.json())
      .then(json => {
        this.videos = json
      }).catch(e => {
        alert("failed to get Videos")
      })

    fetch("http://127.0.0.1:3001/api/group")
      .then(res => res.json())
      .then(json => {
        this.groups = json
      }).catch(e => {
        alert("failed to get groups")
      })
  }
})
</script>

<style scoped>
#sidebar {
  flex-basis: 10rem;
  flex-grow: 1;
}

#content {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 50%;
}

/* video page */

.video-container {
  display: flex;
  flex-wrap: wrap;
}

.video-box {
  margin: 5px;
  /* border: 1px solid; */
  /*
  https://gist.github.com/bojanvidanovic/0b31443827c2c424469da754376180d4
  480px - too big
  */
  width: 320px;
}

.video-link {
  outline: none;
  text-decoration: none;
}

.video-title {
  margin-top: 0;
  margin-bottom: 0.5rem;

  font-size: 1rem;
  color: black;
}

.video-channel-wrapper {
  margin-top: 0;
}

.video-channel {
  outline: none;
  text-decoration: none;
  color: #838383;
}
</style>
