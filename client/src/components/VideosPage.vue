<template>
  <div id="sidebar">
    <form id="sidebar-floating">
      <div>
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
        </label>
        <button>Apply</button>
      </div>
      <hr />
      <div>
        <label>
          Upload Date Before
          <input type="date" v-model="dateFilterSelected" />
        </label>
        <button @click="dateFilterApply">Apply</button>
        <div v-if="dateFilterApplied != null">
          <ul>
            <li>
              <button alt="Remove" @click="dateFilterRemove()">x</button
              >{{ dateFilterApplied }}
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <div>
        <label
          >Limit
          <input type="number" v-model="sizeSelected" @change="sizeApply()"
        /></label>
      </div>
      <hr />
      <div>
        <label>Page control</label>
        <button @click="pageFirst()">First</button>
        <button alt="Previous">&lt;</button>
        <button alt="Next" @click="pageNext()">&gt;</button>
      </div>
      <hr />
      <div>
        <button name="downloadFeeds">Download channel feeds</button>
      </div>
    </form>
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
          <a class="video-channel" :href="'/?channelId=' + video.channelId">{{
            video.channelName
          }}</a>
        </div>
        <div class="video-published">
          <span v-bind:title="video.published">{{
            video.publishedRelative
          }}</span>
        </div>
        <div v-for="group of video.groups?.split(',')">
          <div class="channel-tag" :style="getGroupColorStyle(group)">
            {{ group }}
          </div>
        </div>
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
import {
  findIndexOrFail,
  findOrFail,
  removeOrFail,
} from "../../../server/src/common/util/langutils";
import {
  GroupFilter,
  GetVideosResult,
  ChannelGroup,
} from "../../../server/src/common/util/storage";
import {
  apiGetData,
  apiSendData,
  alertAndThrow,
  changeQueryArray,
} from "../util/httputils";
import { LocationQueryValue } from "vue-router";

interface MyData {
  groups: ChannelGroup[];
  videos: GetVideosResult[];
  groupFilterSelected: string;
  groupFilterApplied: GroupFilter[];
  dateFilterSelected: string | null;
  dateFilterApplied: string | null;
  sizeSelected: number;
}

export default defineComponent({
  name: "VideosPage",
  data() {
    return {
      groups: [],
      videos: [],
      groupFilterSelected: "",
      groupFilterApplied: [],
      dateFilterSelected: null,
      dateFilterApplied: null,
      sizeSelected: 25,
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
    console.log("mounted");
    // intentionally do requests sequentually for early exit errors
    try {
      const groups = (await apiGetData("GET", GET_API_GROUP)) as ChannelGroup[];
      this.groups = groups;
    } catch (e) {
      alertAndThrow(e, "failed to get groups");
      return;
    }

    this._loadParams();

    await this.refreshVideos();
  },
  watch: {
    $route(to, from) {
      // console.log("route change")
      // this._loadParams();
      // this.refreshVideos();
    },
  },
  methods: {
    async refreshVideos(): Promise<void> {
      try {
        const reqJson: VideosRequest = {
          groups: this.groupFilterApplied,
          publishedAfter:
            this.dateFilterApplied == null ? undefined : this.dateFilterApplied,
          limit: this.sizeSelected,
        };
        // everything is proxied so stringify
        console.log("loading videos", JSON.stringify(reqJson));
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
    async groupFilterApply(included: boolean, event: MouseEvent) {
      if (this.groupFilterSelected == "") {
        alert("no element selected");
        return;
      }
      this.groupFilterApplied.push({
        name: this.groupFilterSelected,
        included,
      });

      // remove group name from query
      const query = { ...this.$router.currentRoute.value.query };
      changeQueryArray(
        query,
        included ? "groupInclude" : "groupExclude",
        this.groupFilterSelected,
        true
      );
      this.$router.replace({ query });

      await this.refreshVideos();

      this.groupFilterSelected = "";
    },
    groupFilterRemove(name: string) {
      const groupIndex = findIndexOrFail(
        this.groupFilterApplied,
        (e) => e.name == name
      );
      const group = this.groupFilterApplied[groupIndex];
      this.groupFilterApplied.splice(groupIndex, 1);

      // remove group name from query
      const query = { ...this.$router.currentRoute.value.query };
      changeQueryArray(
        query,
        group.included ? "groupInclude" : "groupExclude",
        group.name,
        false
      );
      this.$router.replace({ query });

      return this.refreshVideos();
    },
    async dateFilterApply() {
      if (this.dateFilterSelected == null) {
        alert("no date selected");
        return;
      }

      this.dateFilterApplied = this.dateFilterSelected;

      const query = {
        ...this.$router.currentRoute.value.query,
        dateFilter: this.dateFilterApplied,
      };
      this.$router.replace({ query });

      await this.refreshVideos();

      this.dateFilterSelected = null;
    },
    async dateFilterRemove() {
      this.dateFilterApplied = null;

      // update query
      const query = {
        ...this.$router.currentRoute.value.query,
      };
      delete query.dateFilter;
      this.$router.replace({ query });

      await this.refreshVideos();
    },
    async sizeApply() {
      const query = {
        ...this.$router.currentRoute.value.query,
        size: this.sizeSelected,
      };
      this.$router.replace({ query });

      await this.refreshVideos();
    },
    async pageFirst() {
      this.dateFilterApplied = null;

      const query = {
        ...this.$router.currentRoute.value.query,
      };
      if (!("dateFilter" in query)) {
        // already no filter
        return;
      }
      delete query.dateFilter;
      this.$router.replace({ query });

      await this.refreshVideos();
    },
    async pageNext() {
      const lastVideo = this.videos[this.videos.length - 1];
      const query = {
        ...this.$router.currentRoute.value.query,
        dateFilter: lastVideo.published,
      };
      this.$router.replace({ query });

      this.dateFilterApplied = lastVideo.published;

      await this.refreshVideos();
    },
    //
    getGroupColorStyle(name: string): string {
      const color = findOrFail(this.groups, (e) => e.groupName == name).color;
      if (color != null) {
        return "background-color: #" + color;
      } else {
        return "";
      }
    },
    //
    _loadParams() {
      const query = this.$router.currentRoute.value.query;
      if ("groupInclude" in query) {
        for (const groupName of (query["groupInclude"] as string).split(",")) {
          if (
            this.groupFilterApplied.find((e) => e.name == groupName) ==
            undefined
          ) {
            this.groupFilterApplied.push({
              name: groupName,
              included: true,
            });
          }
        }
      }
      if ("groupExclude" in query) {
        for (const groupName of (query["groupExclude"] as string).split(",")) {
          if (
            this.groupFilterApplied.find((e) => e.name == groupName) ==
            undefined
          ) {
            this.groupFilterApplied.push({
              name: groupName,
              included: false,
            });
          }
        }
      }
      if ("dateFilter" in query) {
        this.dateFilterApplied = query["dateFilter"] as string;
      }
      if ("size" in query) {
        this.sizeSelected = Number.parseInt(query["size"] as string, 10);
      }
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
