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
        <a class="video-link" href="https://www.youtube.com/watch?v={{videoId}}">
          <img src="https://i4.ytimg.com/vi/{{videoId}}/mqdefault.jpg" />
          <h3 class="video-title">{{ video.title }}</h3>
        </a>
        <div class="video-channel-wrapper">
          <a class="video-channel" href="/?channelId={{channelId}}">{{ video.channelName }}</a>
        </div>
        <div class="video-published">{{ video.published }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue'
import { GetVideosResult, ChannelGroup } from "../../../server/src/server/util/storage"
import { GET_API_VIDEOS } from "../../../server/src/server/routes/ApiVideosRoute"

interface MyData {
  groups: ChannelGroup[],
  videos: GetVideosResult[],
}

export default defineComponent({
  name: 'HelloWorld',
  data() {
    return {
        groups: [],
        videos: [],
    } as MyData
  },
  async mounted() {
    const res = await fetch("http://127.0.0.1:3001" + GET_API_VIDEOS)
    this.videos = await res.json()
  }
})
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
