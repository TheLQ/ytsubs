<template>
  <div id="sidebar">
    <h2>Filters</h2>

    <div>
      <form>
        <label>
          Groups
          <select v-model="groupFilterSelected">
            <option></option>
            <option
              v-for="group in groupFilterAvailable"
              v-bind:style="'background-color: #' + group.color"
            >{{ group.groupName }}</option>
          </select>
        </label>
        <button @click="groupFilterApply(true, $event)">Include</button>
        <button @click="groupFilterApply(false, $event)">Exclude</button>
        <ul>
          <li v-for="group of groupFilterApplied">
            <button alt="Remove" @click="groupFilterRemove(group.name)">x</button>
            {{ group.included ? "+" : "-" }} {{ group.name }}
          </li>
        </ul>
      </form>
    </div>
    <hr />
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
    <hr />
    <div>
      <label>
        Upload Date After
        <input type="date" />
        <button>Apply</button>
      </label>
    </div>
    <hr />
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

import { GroupFilter, POST_API_VIDEOS, VideosRequest } from '../../../server/src/common/routes/ApiVideosRoute'
import { WrappedError } from '../../../server/src/server/util/error'
import { findIndexOrFail } from '../../../server/src/server/util/langutils'
import { GetVideosResult, ChannelGroup } from "../../../server/src/server/util/storage"

interface MyData {
  groups: ChannelGroup[],
  videos: GetVideosResult[],
  groupFilterSelected: string,
  groupFilterApplied: GroupFilter[]
}

export default defineComponent({
  name: 'VideosPage',
  data() {
    return {
      groups: [],
      videos: [],
      groupFilterSelected: "",
      groupFilterApplied: [],
    } as MyData
  },
  computed: {
    groupFilterAvailable(): ChannelGroup[] {
      return this.groups.filter(e => {
        for (const applied of this.groupFilterApplied) {
          if (applied.name == e.groupName) {
            return false;
          }
        }
        return true;
      });
    }
  },
  mounted() {
    this.refreshVideos()
    .catch(e => {
      alert(e);
      throw e;
    });

    fetch("http://127.0.0.1:3001/api/group")
      .then(res => res.json())
      .then(json => {
        this.groups = json
      }).catch(e => {
        alert("failed to get groups")
      })
  },
  methods: {
    async refreshVideos(): Promise<void> {
      const reqJson: VideosRequest = {
        groups: this.groupFilterApplied
      }

      const res = await fetch("http://127.0.0.1:3001" + POST_API_VIDEOS, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(reqJson)
      })
      const body = await res.text()

      let json;
      if (body == "") {
        throw new Error("Body is empty")
      }
      try {
        json = JSON.parse(body);
      } catch (e) {
        throw new WrappedError("failed to parse response, body follows\r\n" + body, e);
      }

      this.videos = json
    },
    groupFilterApply(included: boolean, event: MouseEvent) {
      // stop form submission
      event.preventDefault();

      if (this.groupFilterSelected == "") {
        alert("no element selected")
        return
      }
      this.groupFilterApplied.push({
        name: this.groupFilterSelected,
        included,
      })
      this.groupFilterSelected = ""
    },
    groupFilterRemove(name: string) {
      const groupIndex = findIndexOrFail(this.groupFilterApplied, e => e.name == name)
      this.groupFilterApplied.splice(groupIndex, 1);
    }
  }
})
</script>

<style scoped>
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
