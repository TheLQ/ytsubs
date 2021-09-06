<template>
  <div class="sidebar">
    <form>
      <fieldset>
        <legend>Sync Subscriptions</legend>
        <label>
          Upload
          <a
            href="https://www.youtube.com/subscription_manager?action_takeout=1"
            >Subscription XML</a
          >
          <input type="file" name="xml" />
          <button type="button" name="uploadSubscriptions" :disabled="true">
            Upload Subscriptions File
          </button>
        </label>

        <hr />

        <button type="button" :disabled="!youtubeSignedIn">
          Sync from YouTube
        </button>
      </fieldset>

      <GroupSelector
        name="Include Groups"
        :groups-applied="groupIncludeApplied"
        :add-none-all-groups="true"
        query-parameter="groupsInclude"
        @new-groups-applied="groupsIncludeUpdate"
      />

      <fieldset>
        <legend>Add group</legend>
        <input
          type="text"
          v-model="groupAddName"
          :disabled="groupAddNameWorking"
        />
        <button
          type="button"
          :disabled="groupAddNameWorking"
          @click="groupAddApply"
        >
          Add Group
        </button>
      </fieldset>

      <fieldset>
        <legend>Group Edit</legend>
        <select
          v-model="groupEditName"
          @change="groupEditNameApply"
          :disabled="groupEditWorking"
        >
          <option v-for="group of groups" :style="getGroupColorStyle(group)">
            {{ group.groupName }}
          </option>
        </select>

        <hr />

        <label>
          <input
            type="color"
            v-model="groupEditColor"
            :disabled="groupEditEnabled"
            @change="groupEditColorApply"
          />
          Color
        </label>

        <hr />

        <button
          type="button"
          :disabled="groupEditEnabled"
          @click="groupEditDelete"
        >
          Delete
        </button>
      </fieldset>
    </form>
  </div>
  <main>
    <LoadingBox />
    <ul>
      <li v-for="channel of channelsFiltered">
        <a :href="'https://www.youtube.com/channel/' + channel.channelId">{{
          channel.channelName
        }}</a>
        -
        <GroupsDisplay
          :channel-id="channel.channelId"
          :groups-applied="channel.groups?.split(',') || []"
          :add-displayed="true"
          @mapping-event="channelMappingApply"
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
  GROUP_MAGIC_NONE,
} from "../../../server/src/common/util/storage";
import {
  apiGroup,
  apiGroupColor,
  GET_API_GROUP,
} from "../../../server/src/common/routes/ApiGroupRoute";
import {
  GET_API_CHANNEL,
  apiChannelGroup,
} from "../../../server/src/common/routes/ApiChannelRoute";
import { findOrFail } from "../../../server/src/common/util/langutils";
import { apiGetData, alertAndThrow, apiAction } from "../util/httputils";
import LoadingBox from "../components/LoadingBox.vue";
import GroupsDisplay, { MappingEvent } from "../components/GroupsDisplay.vue";
import { MutationTypes, YoutubeState } from "../VueStore";
import GroupSelector, {
  updateGroupSelected,
} from "../components/GroupSelector.vue";
import { getGroupColorStyle } from "../utils";

interface Channel extends SubscriptionStorage {
  groupsInfo: ChannelGroup[];
}

interface MyData {
  channels: Channel[];
  groupIncludeApplied: string[];
  groupAddName: string;
  groupAddNameWorking: boolean;
  groupEditName: string;
  groupEditColor: string | null;
  groupEditWorking: boolean;
}

export default defineComponent({
  name: "ChannelsPage",
  components: {
    GroupSelector,
    GroupsDisplay,
    LoadingBox,
  },
  //
  // Data
  //
  data() {
    return {
      channels: [],
      groupIncludeApplied: [],
      groupAddName: "",
      groupAddNameWorking: false,
      groupEditName: "",
      groupEditColor: null,
      groupEditWorking: false,
    } as MyData;
  },
  computed: {
    groups(): ChannelGroup[] {
      return this.$store.state.groups;
    },
    groupEditEnabled(): boolean {
      return this.groupEditWorking || this.groupEditName == "";
    },
    channelsFiltered(): Channel[] {
      // filtering on the server is silly for this number of channels
      // instead filter client side
      if (this.groupIncludeApplied.length == 0) {
        return this.channels;
      } else {
        return this.channels.filter((channel) => {
          const channelGroups = channel.groups?.split(",") || [];
          for (const groupInclude of this.groupIncludeApplied) {
            if (groupInclude == GROUP_MAGIC_NONE) {
              if (channelGroups.length == 0) {
                return true;
              }
            } else if (channelGroups.indexOf(groupInclude) != -1) {
              return true;
            }
          }
          return false;
        });
      }
    },
    youtubeSignedIn(): boolean {
      return this.$store.state.youtube.signedIn;
    },
  },
  //
  // events
  //
  async mounted() {
    this._refreshSubscriptions();
  },
  //
  // Methods
  //
  methods: {
    getGroupColorStyle,
    /**
     * Load channels from API
     */
    async _refreshSubscriptions(): Promise<void> {
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
     * Group include form - on check, update UI
     */
    groupsIncludeUpdate(event: string[]): void {
      this.groupIncludeApplied = event;
      // groups will self filter in computed property
    },
    /**
     * Group add form - on submit, update API and UI
     */
    async groupAddApply(): Promise<void> {
      this.groupAddNameWorking = true;
      try {
        await apiAction("PUT", apiGroup(this.groupAddName));
      } catch (e) {
        throw alertAndThrow(e, "failed to add group");
      }

      this.$store.commit(MutationTypes.GROUP_ADD, [
        {
          groupName: this.groupAddName,
          color: null,
        },
      ]);
      this.groupAddName = "";
      this.groupAddNameWorking = false;
    },
    /**
     * Group edit form - on group select, update UI
     */
    groupEditNameApply(): void {
      const group = findOrFail(
        this.groups,
        (e) => e.groupName == this.groupEditName
      );
      if (group.color != null) {
        this.groupEditColor = "#" + group.color;
      } else {
        this.groupEditColor = null;
      }
    },
    /**
     * Group edit form - On changed color input, update API and UI
     */
    async groupEditColorApply(): Promise<void> {
      if (this.groupEditColor == null) {
        alert("please select color");
        return;
      }
      // color without # prefix
      const color = this.groupEditColor.substring(1);

      this.groupEditWorking = true;
      try {
        await apiAction("PUT", apiGroupColor(this.groupEditName, color));
      } catch (e) {
        throw alertAndThrow(e, "failed to set group color");
      }

      this.$store.commit(MutationTypes.GROUP_COLOR, {
        group: this.groupEditName,
        color,
      });
      this.groupEditWorking = false;
    },
    /**
     * Group edit form - On delete submit, update API and UI
     */
    async groupEditDelete(): Promise<void> {
      this.groupEditWorking = true;
      try {
        await apiAction("DELETE", apiGroup(this.groupEditName));
      } catch (e) {
        throw alertAndThrow(e, "failed to set group color");
      }

      this.$store.commit(MutationTypes.GROUP_DELETE, this.groupEditName);
      this.groupEditWorking = false;
    },
    /**
     * Channel's group form - On group (un)selected, update UI. API already updated by component.
     */
    channelMappingApply(event: MappingEvent): void {
      const channel = findOrFail(
        this.channels,
        (e) => e.channelId == event.channelId
      );
      channel.groups = updateGroupSelected(event, channel.groups);
    },
  },
});
</script>

<style scoped></style>
