<template>
  <div id="sidebar">
    <form>
      <div>
        <label>
          Upload subscription list from
          <a
            href="https://www.youtube.com/subscription_manager?action_takeout=1"
            >Youtube Subscription Manager</a
          >
          <input type="file" name="xml" />
          <button type="button" name="uploadSubscriptions">
            Upload Subscriptions
          </button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Check Youtube Auth
          <button type="button" name="checkYoutubeAuth">
            Check Youtube Auth
          </button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Sync Subscriptions
          <button type="button" name="syncSubscriptions">
            Upload Subscriptions
          </button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Add group
          <input type="text" v-model="addGroupName" />
          <button type="button">Add Group</button>
        </label>
      </div>
      <hr />
      <div>
        <select v-model="groupColorName">
          <option></option>
          <option v-for="group of groups">
            {{ group.groupName }}
          </option>
        </select>
        <input type="color" v-model="groupColorValue" />
        <button type="button" @click.prevent="setGroupColor()">
          Set Group Color
        </button>
      </div>
    </form>
  </div>
  <main>
    <LoadingBox />
    <ul>
      <li v-for="channel of channels">
        <a :href="'https://www.youtube.com/channel/' + channel.channelId">{{
          channel.channelName
        }}</a>
        -
        <GroupsDisplay
          :channel-id="channel.channelId"
          :groups-applied="channel.groups?.split(',') || []"
          :add-displayed="true"
          @mapping-event="onNewChannelMapping"
        />
      </li>
    </ul>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  SubscriptionStorage,
  ChannelGroup,
} from "../../../server/src/common/util/storage";
import {
  apiGroupColor,
  GET_API_GROUP,
} from "../../../server/src/common/routes/ApiGroupRoute";
import {
  GET_API_CHANNEL,
  apiChannelGroup,
} from "../../../server/src/common/routes/ApiChannelRoute";
import {
  findOrFail,
  findIndexOrFail,
  stringSort,
} from "../../../server/src/common/util/langutils";
import { apiGetData, alertAndThrow, apiAction } from "../util/httputils";
import LoadingBox from "../components/LoadingBox.vue";
import GroupsDisplay, { MappingEvent } from "../components/GroupsDisplay.vue";
import { MutationTypes } from "../VueStore";
import GroupSelector, {
  updateGroupSelected,
} from "../components/GroupSelector.vue";

interface Channel extends SubscriptionStorage {
  groupsInfo: ChannelGroup[];
}

interface MyData {
  channels: Channel[];
  groups: ChannelGroup[];
  addGroupName: string;
  groupColorName: string;
  groupColorValue: string;
}

export default defineComponent({
  name: "ChannelsPage",
  components: {
    GroupsDisplay,
    LoadingBox,
  },
  data() {
    return {
      channels: [],
      groups: [],
      addGroupName: "",
      groupColorName: "",
      groupColorValue: "",
    } as MyData;
  },
  async mounted() {
    this._refreshSubscriptions();
    // try {

    //   // TS: Comes in as SubscriptionStorage but we add the Channel groupsInfo
    //   const channels = (await apiGetData("GET", GET_API_CHANNEL)) as Channel[];
    //   this.channels = channels.map((entry) => {
    //     if (entry.groups) {
    //       entry.groupsInfo = entry.groups
    //         .split(",")
    //         .map((groupNeedle) =>
    //           findOrFail(this.groups, (e) => e.groupName == groupNeedle)
    //         );
    //       entry.groupsInfo.sort((a, b) => stringSort(a.groupName, b.groupName));
    //     } else {
    //       entry.groupsInfo = [];
    //     }
    //     return entry;
    //   });
    // } catch (e) {
    //   alertAndThrow(e, "failed to get channels");
    //   return;
    // }
  },
  methods: {
    async _refreshSubscriptions() {
      const loadingMessage = "Loading channels...";
      this.$store.commit(MutationTypes.LOADING_ADD, loadingMessage);
      try {
        const channels = (await apiGetData(
          "GET",
          GET_API_CHANNEL
        )) as Channel[];
        this.channels = channels;
      } catch (e) {
        throw alertAndThrow(e, "failed to get channels");
      }

      this.$store.commit(MutationTypes.LOADING_DONE, loadingMessage);
    },
    /**
     * Update selected channel's groups
     * UI update only, API already updated
     */
    onNewChannelMapping(event: MappingEvent) {
      const channel = findOrFail(
        this.channels,
        (e) => e.channelId == event.channelId
      );
      channel.groups = updateGroupSelected(event, channel.groups);
    },
    async setGroupColor(): Promise<void> {
      console.log(this.groupColorName + " val " + this.groupColorValue);
      if (this.groupColorName == "") {
        alert("please select group");
        return;
      }
      if (this.groupColorValue == "") {
        alert("please select color");
        return;
      }
      const color = this.groupColorValue.substring(1);

      const group = findOrFail(
        this.groups,
        (e) => e.groupName == this.groupColorName
      );
      group.color = color;

      try {
        await apiAction("PUT", apiGroupColor(group.groupName, color));
      } catch (e) {
        alertAndThrow(e, "failed to set group color");
        return;
      }

      this.groupColorName = "";
    },
  },
});
</script>

<style scoped>
.group-channel-add-form {
  display: inline;
}

.group-channel-remove-form {
  display: inline;
}
</style>
