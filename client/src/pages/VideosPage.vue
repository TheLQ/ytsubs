<template>
  <div class="sidebar">
    <form>
      <GroupSelector
        name="Include Groups"
        :groups-applied="groupIncludeApplied"
        :add-none-all-groups="true"
        query-parameter="groupsInclude"
        @new-groups-applied="groupsIncludeUpdate"
      />

      <fieldset>
        <legend>Upload Dates</legend>
        <label
          >Upload Date Before
          <input type="date" v-model="dateFilterSelected" />
        </label>
        <button type="button" @click="dateFilterApply">Apply</button>
        <div v-if="dateFilterApplied != null">
          <ul>
            <li>
              <button type="button" alt="Remove" @click="dateFilterRemove()">
                x
              </button>
              {{ dateFilterApplied }}
            </li>
          </ul>
        </div>

        <hr />

        <label>
          Frequency
          <select>
            <option></option>
            <option>&lt;5 past month</option>
            <option>&lt;5 6 months</option>
            <option>&lt;10 6 months</option>
          </select>
        </label>
        <button type="button">Apply</button>
      </fieldset>

      <fieldset>
        <legend>Page control</legend>
        <button type="button" @click="pageFirst()">First</button>
        <button type="button" alt="Previous">&lt;</button>
        <button type="button" alt="Next" @click="pageNext()">&gt;</button>

        <hr />

        <label>
          Limit
          <input type="number" v-model="sizeSelected" @change="sizeApply()" />
        </label>
      </fieldset>

      <fieldset>
        <legend>Options</legend>
        <label>
          <input type="checkbox" v-model="groupAddOpenDisplayed" />
          Display Add Group
        </label>
      </fieldset>

      <fieldset>
        <legend>YouTube</legend>
        <button type="submit" name="downloadFeeds">
          Download channel feeds
        </button>
      </fieldset>
    </form>
  </div>
  <main>
    <LoadingBox />
    <!-- isLoadingDone($store) -->
    <div class="video-container" v-if="isLoadingDone($store)">
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

          <GroupsDisplay
            :channel-id="video.channelId"
            :groups-applied="video.groups?.split(',') || []"
            :add-displayed="true"
            @mapping-event="onNewChannelMapping"
          />
        </div>
        <div class="video-published">
          <span v-bind:title="video.published">
            {{ video.publishedRelative }}
          </span>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";

import {
  POST_API_VIDEOS,
  VideosRequest,
} from "../../../server/src/common/routes/ApiVideosRoute";
import { POST_YOUTUBE_CHANNELS_UPDATE } from "../../../server/src/common/routes/ApiYoutubeRoute";
import {
  GroupFilter,
  GetVideosResult,
  ChannelGroup,
  VideoStorage,
} from "../../../server/src/common/util/storage";
import {
  apiGetData,
  apiSendData,
  alertAndThrow,
  changeQueryArray,
} from "../util/httputils";
import GroupsDisplay, { MappingEvent } from "../components/GroupsDisplay.vue";
import GroupSelector, {
  updateGroupSelected,
} from "../components/GroupSelector.vue";
import {
  copyArray as copyArrayTo,
  findOrFail,
  removeOrFail,
} from "../../../server/src/common/util/langutils";
import LoadingBox, { isLoadingDone } from "../components/LoadingBox.vue";
import { MutationTypes } from "../VueStore";

interface MyData {
  videos: GetVideosResult[];
  groupIncludeApplied: string[];
  dateFilterSelected: string | null;
  dateFilterApplied: string | null;
  sizeSelected: number;
  channelUpdateUrl: string;
  groupAddOpenDisplayed: boolean;
  groupAddFormDisplayedId: string | null;
}

export default defineComponent({
  name: "VideosPage",
  components: {
    GroupsDisplay,
    GroupSelector,
    LoadingBox,
  },
  data() {
    return {
      videos: [],
      groupIncludeApplied: [],
      dateFilterSelected: null,
      dateFilterApplied: null,
      sizeSelected: 20,
      channelUpdateUrl: "http://127.0.0.1:3001" + POST_YOUTUBE_CHANNELS_UPDATE,
      groupAddOpenDisplayed: true,
      groupAddFormDisplayedId: null,
      groupAddFormGroups: [],
    } as MyData;
  },

  async mounted() {
    console.log("mounted");

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
    isLoadingDone,
    async refreshVideos(): Promise<void> {
      try {
        const groupFilter: GroupFilter[] = [];
        for (const entry of this.groupIncludeApplied) {
          groupFilter.push({
            name: entry,
            included: true,
          });
        }

        const reqJson: VideosRequest = {
          groups: groupFilter,
          publishedAfter:
            this.dateFilterApplied == null ? undefined : this.dateFilterApplied,
          limit: this.sizeSelected,
        };
        // everything is proxied so stringify
        const loadingMessage = "Loading Videos " + JSON.stringify(reqJson);
        this.$store.commit(MutationTypes.LOADING_ADD, loadingMessage);
        const result = (await apiSendData(
          "POST",
          POST_API_VIDEOS,
          reqJson
        )) as GetVideosResult[];
        this.$store.commit(MutationTypes.LOADING_DONE, loadingMessage);
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
      // TODO REPLACED WITH BEWLOW
      // this.groupFilterApplied = groupFilter.map((e) => {
      //   return { name: e, included: true };
      // });
      this.groupIncludeApplied.length = 0;
      copyArrayTo(groupFilter, this.groupIncludeApplied);

      this.refreshVideos();
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
    /**
     * Update selected video's groups and distribute to the channel's other videos
     * UI update only, API already updated
     */
    onNewChannelMapping(event: MappingEvent) {
      console.log("newChannelMapping event", JSON.stringify(event));

      let firstVideo = findOrFail(
        this.videos,
        (e) => e.channelId == event.channelId
      );
      const groupsValue = updateGroupSelected(event, firstVideo.groups);

      // apply new mapping to all videos on current page
      // subsequent pages will re-query so have new groups
      for (const video of this.videos) {
        if (video.channelId == event.channelId) {
          video.groups = groupsValue;
        }
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
