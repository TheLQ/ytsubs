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
          <button name="uploadSubscriptions">Upload Subscriptions</button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Check Youtube Auth
          <button name="checkYoutubeAuth">Check Youtube Auth</button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Sync Subscriptions
          <button name="syncSubscriptions">Upload Subscriptions</button>
        </label>
      </div>
      <hr />
      <div>
        <label>
          Add group
          <input type="text" name="groupName" />
          <button name="addGroup">Add Group</button>
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
        <button @click.prevent="setGroupColor()">Set Group Color</button>
      </div>
    </form>
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
            @click="removeChannelGroup(channel.channelId, group.groupName)"
          >
            x
          </button>
        </div>
        <select @change="addChannelGroup(channel.channelId, $event)">
          <option value></option>
          <option v-for="group of groups">
            {{ group.groupName }}
          </option>
        </select>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, registerRuntimeCompiler } from "vue";
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

interface Channel extends SubscriptionStorage {
  groupsInfo: ChannelGroup[];
}

interface MyData {
  channels: Channel[];
  groups: ChannelGroup[];
  groupColorName: string;
  groupColorValue: string;
}

export default defineComponent({
  name: "ChannelsPage",
  data() {
    return {
      channels: [],
      groups: [],
      groupColorName: "",
      groupColorValue: "",
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
        alertAndThrow(e, "failed to create channel group");
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
