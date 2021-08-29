<template>
  <div id="sidebar">
    <div>
      <form>
        <label>
          Groups
          <select v-model="groupFilterSelected">
            <option></option>
            <option
              v-for="group in groupFilterAvailable"
              :style="'background-color: #' + group.color"
            >
              {{ group.groupName }}
            </option>
          </select>
        </label>
        <button @click="groupFilterApply(true, $event)">Include</button>
        <button @click="groupFilterApply(false, $event)">Exclude</button>
        <ul>
          <li v-for="group of groupFilterApplied">
            <button alt="Remove" @click="groupFilterRemove(group.name)">
              x
            </button>
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
    <div class="video-container">
      <div v-for="video in videos" class="video-box">
        <a
          class="video-link"
          :href="'https://www.youtube.com/watch?v=' + video.videoId"
        >
          <img
            :src="'https://i4.ytimg.com/vi/' + video.videoId + '/mqdefault.jpg'"
          />
          <h3 class="video-title">{{ video.title }}</h3>
        </a>
        <div class="video-channel-wrapper">
          <a class="video-channel" :href="'/?channelId=' + video.channelId">
            {{ video.channelName }}
          </a>
        </div>
        <div class="video-published">{{ video.publishedRelative }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";

import {
  POST_API_VIDEOS,
  VideosRequest,
} from "../../../server/src/common/routes/ApiVideosRoute";
import { GET_API_GROUP } from "../../../server/src/common/routes/ApiGroupRoute";
import { findIndexOrFail } from "../../../server/src/common/util/langutils";
import {
  GroupFilter,
  GetVideosResult,
  ChannelGroup,
} from "../../../server/src/common/util/storage";
import { apiGetData, apiSendData, alertAndThrow } from "../util/httputils";

interface MyData {
  groups: ChannelGroup[];
  videos: GetVideosResult[];
  groupFilterSelected: string;
  groupFilterApplied: GroupFilter[];
}

export default defineComponent({
  name: "VideosPage",
  data() {
    return {
      groups: [],
      videos: [],
      groupFilterSelected: "",
      groupFilterApplied: [],
    } as MyData;
  },
  computed: {
    groupFilterAvailable(): ChannelGroup[] {
      return this.groups.filter((e) => {
        for (const applied of this.groupFilterApplied) {
          if (applied.name == e.groupName) {
            return false;
          }
        }
        return true;
      });
    },
  },
  async mounted() {
    // intentionally do requests sequentually for early exit errors
    try {
      const groups = (await apiGetData("GET", GET_API_GROUP)) as ChannelGroup[];
      this.groups = groups;
    } catch (e) {
      alertAndThrow(e, "failed to get groups");
      return;
    }

    await this.refreshVideos();
  },
  methods: {
    async refreshVideos(): Promise<void> {
      try {
        const reqJson: VideosRequest = {
          groups: this.groupFilterApplied,
        };
        const result = (await apiSendData(
          "POST",
          POST_API_VIDEOS,
          reqJson
        )) as GetVideosResult[];
        this.videos = result;
      } catch (e) {
        alertAndThrow(e, "failed to get groups");
        return;
      }
    },
    groupFilterApply(included: boolean, event: MouseEvent) {
      if (this.groupFilterSelected == "") {
        alert("no element selected");
        return;
      }
      this.groupFilterApplied.push({
        name: this.groupFilterSelected,
        included,
      });
      this.groupFilterSelected = "";

      return this.refreshVideos();
    },
    groupFilterRemove(name: string) {
      const groupIndex = findIndexOrFail(
        this.groupFilterApplied,
        (e) => e.name == name
      );
      this.groupFilterApplied.splice(groupIndex, 1);

      return this.refreshVideos();
    },
  },
});
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
