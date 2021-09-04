<template>
  <div id="sidebar">
    <form id="sidebar-floating">
      <GroupSelector
        name="Include Groups"
        v-bind:initial-all-selected="false"
        v-bind:add-none-group="true"
        query-parameter="groupsInclude"
        @new-group-selected="groupsIncludeUpdate"
        @new-groups="groupsUpdate"
      />

      <fieldset>
        <legend>Upload Frequency</legend>
        <select>
          <option></option>
          <option>&lt;5 past month</option>
          <option>&lt;5 6 months</option>
          <option>&lt;10 6 months</option>
        </select>
        <button type="button">Apply</button>
      </fieldset>

      <fieldset>
        <legend>Upload Date Before</legend>
        <input type="date" v-model="dateFilterSelected" />
        <button type="button" @click="dateFilterApply">Apply</button>
        <div v-if="dateFilterApplied != null">
          <ul>
            <li>
              <button type="button" alt="Remove" @click="dateFilterRemove()">
                x</button
              >{{ dateFilterApplied }}
            </li>
          </ul>
        </div>
      </fieldset>

      <fieldset>
        <legend>Limit</legend>
        <input type="number" v-model="sizeSelected" @change="sizeApply()" />
      </fieldset>

      <fieldset>
        <legend>Page control</legend>
        <button type="button" @click="pageFirst()">First</button>
        <button type="button" alt="Previous">&lt;</button>
        <button type="button" alt="Next" @click="pageNext()">&gt;</button>
      </fieldset>
    </form>
    <form v-bind:action="channelUpdateUrl" method="POST">
      <div>
        <button type="submit" name="downloadFeeds">
          Download channel feeds
        </button>
      </div>
    </form>
  </div>
  <main>
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
  </main>
</template>

<script lang="ts">
import GroupSelector from "./GroupSelector.vue";
import { ref, defineComponent, PropType } from "vue";

import {
  POST_API_VIDEOS,
  VideosRequest,
} from "../../../server/src/common/routes/ApiVideosRoute";
import { GET_API_GROUP } from "../../../server/src/common/routes/ApiGroupRoute";
import { POST_YOUTUBE_CHANNELS_UPDATE } from "../../../server/src/common/routes/ApiYoutubeRoute";
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
  groupFilterApplied: GroupFilter[];
  dateFilterSelected: string | null;
  dateFilterApplied: string | null;
  sizeSelected: number;
  channelUpdateUrl: string;
}

export default defineComponent({
  name: "VideosPage",
  components: {
    GroupSelector,
  },
  data() {
    return {
      groups: [],
      videos: [],
      groupFilterApplied: [],
      dateFilterSelected: null,
      dateFilterApplied: null,
      sizeSelected: 25,
      channelUpdateUrl: "http://127.0.0.1:3001" + POST_YOUTUBE_CHANNELS_UPDATE,
    } as MyData;
  },

  async mounted() {
    console.log("mounted");

    this._loadParams();

    // await this.refreshVideos();
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
    /**
     * New filter is applied, refresh
     */
    async groupsIncludeUpdate(groupFilter: string[]) {
      this.groupFilterApplied = groupFilter.map((e) => {
        return { name: e, included: true };
      });
      this.refreshVideos();
    },
    /**
     * Update our copy of groups if the GroupFilterSelector adds a new group
     */
    async groupsUpdate(groups: ChannelGroup[]) {
      this.groups = groups;

      // If this is the first page load, our groups array is empty.
      // Pull from this component then load videos
      // TODO: this may cause unnessary refreshes if the group filter truely returns empty results
      if (this.videos.length == 0) {
        this.refreshVideos();
      }
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
