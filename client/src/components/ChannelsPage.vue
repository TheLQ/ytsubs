<template>
  <div id="sidebar">
    <div>
      <label>
        Upload subscription list from
        <a href="https://www.youtube.com/subscription_manager?action_takeout=1"
          >Youtube Subscription Manager</a
        >
        <input type="file" name="xml" />
        <button type="submit" name="uploadSubscriptions">
          Upload Subscriptions
        </button>
      </label>
    </div>

    <div>
      <label>
        Check Youtube Auth
        <button type="submit" name="checkYoutubeAuth">
          Check Youtube Auth
        </button>
      </label>
    </div>

    <div>
      <label>
        Sync Subscriptions
        <button type="submit" name="syncSubscriptions">
          Upload Subscriptions
        </button>
      </label>
    </div>

    <div>
      <label>
        Add group
        <input type="text" name="groupName" />
        <button type="submit" name="addGroup">Add Group</button>
      </label>
    </div>

    <div>
      <select name="groupName">
        <option value></option>
      </select>
      <input type="color" name="color" />
      <button type="submit" name="setGroupColor">Set Group Color</button>
    </div>
  </div>
  <div id="content">
    <ul>
      <li v-for="channel of channels">
        <a :href="'https://www.youtube.com/channel/' + channel.channelId">{{
          channel.channelName
        }}</a>
        -
        <div
          v-for="group of channel.groupsInfo"
          class="channel-tag"
          :style="'background-color: #' + group.color"
        >
          {{ group.groupName }}
          <button
            type="button"
            name="submit"
            @click="removeChannelGroup(channel.channelId, group.groupName)"
          >
            x
          </button>
        </div>
        <select
          name="groupName"
          @change="addChannelGroup(channel.channelId, $event)"
        >
          <option value></option>
          <option v-for="group of groups" :value="group.groupName">
            {{ group.groupName }}
          </option>
        </select>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import {
  SubscriptionStorage,
  ChannelGroup,
} from "../../../server/src/common/util/storage";
import { GET_API_GROUP } from "../../../server/src/common/routes/ApiGroupRoute";
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

interface Channel extends SubscriptionStorage {
  groupsInfo: ChannelGroup[];
}

interface MyData {
  channels: Channel[];
  groups: ChannelGroup[];
}

export default defineComponent({
  name: "ChannelsPage",
  data() {
    return {
      channels: [],
      groups: [],
    } as MyData;
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

    try {
      // TS: Comes in as SubscriptionStorage but we add the Channel groupsInfo
      const channels = (await apiGetData("GET", GET_API_CHANNEL)) as Channel[];
      this.channels = channels.map((entry) => {
        if (entry.groups) {
          entry.groupsInfo = entry.groups
            .split(",")
            .map((groupNeedle) =>
              findOrFail(this.groups, (e) => e.groupName == groupNeedle)
            );
          entry.groupsInfo.sort((a, b) => stringSort(a.groupName, b.groupName));
        } else {
          entry.groupsInfo = [];
        }
        return entry;
      });
    } catch (e) {
      alertAndThrow(e, "failed to get channels");
      return;
    }
  },
  methods: {
    async removeChannelGroup(
      channelId: string,
      groupName: string
    ): Promise<void> {
      const channel = findOrFail(
        this.$data.channels,
        (e) => e.channelId == channelId
      );
      if (channel.groups == undefined) {
        throw new Error("state error");
      }
      const groupIndex = findIndexOrFail(
        channel.groupsInfo,
        (e) => e.groupName == groupName
      );
      channel.groupsInfo.splice(groupIndex, 1);

      try {
        await apiAction("DELETE", apiChannelGroup(channelId, groupName));
      } catch (e) {
        alertAndThrow(e, "failed to delete channel group");
        return;
      }
    },
    async addChannelGroup(channelId: string, event: Event): Promise<void> {
      if (!event.target) {
        throw new Error("state error");
      }
      const groupName = (event.target as HTMLSelectElement).value;

      const channel = findOrFail(
        this.$data.channels,
        (e) => e.channelId == channelId
      );
      channel.groupsInfo.push(
        findOrFail(this.$data.groups, (e) => e.groupName == groupName)
      );

      try {
        await apiAction("PUT", apiChannelGroup(channelId, groupName));
      } catch (e) {
        alertAndThrow(e, "failed to delete channel group");
        return;
      }
    },
  },
});
</script>

<style scoped>
.channel-tag {
  display: inline;
}

.group-channel-add-form {
  display: inline;
}

.group-channel-remove-form {
  display: inline;
}
</style>
