<template>
  <div id="sidebar">
    <h2>Filters</h2>
    
    <div>
      <label>
        Groups
        <select id="groupFilter">
          <option></option>
          <option v-for="group in groups">{{ group.groupName }}</option>
        </select>
        <button @select="doGroupFilter(true)">Include</button>
        <button @select="doGroupFilter(false)">Exclude</button>
      </label>
    </div>
    <hr/>
    <div>
      <label>
        Upload Frequency
        <select>
          <option></option>
          <option>&lt;5 past month</option>
          <option>&lt;5 6 months</option>
          <option>&lt;10 6 months</option>
        </select>
        <button>Apply</button>
      </label>
    </div>
    <hr/>
    <div>
      <label>
        Upload Date After
        <input type="date"/>
        <button>Apply</button>
      </label>
    </div>
    <hr/>
    <div>
      <button name="downloadFeeds">Download channel feeds</button>
    </div>
  </div>
  <div id="content">
    <h1>Videos</h1>
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
  },
  methods: {
    doGroupFilter(include: boolean) {
      const selector = document.getElementById("groupFilter") as HTMLSelectElement;
      const currentOption = selector.value
      if (currentOption == "") {
        alert("no element selected")
      }



      selector.selectedIndex = 0;
    }
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
