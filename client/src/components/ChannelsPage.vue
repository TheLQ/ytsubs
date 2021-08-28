<template>
  <div id="sidebar">
    <div>
      <label>
        Upload subscription list from
        <a
          href="https://www.youtube.com/subscription_manager?action_takeout=1"
        >Youtube Subscription Manager</a>
        <input type="file" name="xml" />
        <button type="submit" name="uploadSubscriptions">Upload Subscriptions</button>
      </label>
    </div>

    <div>
      <label>
        Check Youtube Auth
        <button type="submit" name="checkYoutubeAuth">Check Youtube Auth</button>
      </label>
    </div>

    <div>
      <label>
        Sync Subscriptions
        <button type="submit" name="syncSubscriptions">Upload Subscriptions</button>
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
    <h1>Subscriptions</h1>
    <ul>
      <li v-for="channel of channels">
        <a
          v-bind:href="'https://www.youtube.com/channel/' + channel.channelId"
        >{{ channel.channelName }}</a> -
        <div
          class="channel-tag"
          v-bind:style="'background-color: #' + group.color"
          v-for="group of channel.groupsInfo"
        >
          {{ group.groupName }}
          <button
            type="button"
            name="submit"
            @click="removeChannelGroup(channel.channelId, group.groupName)"
          >x</button>
        </div>
        <select name="groupName" @change="addChannelGroup(channel.channelId, $event)">
          <option value></option>
          <option v-bind:value="group.groupName" v-for="group of groups">{{ group.groupName }}</option>
        </select>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
import { SubscriptionStorage, ChannelGroup } from '../../../server/src/server/util/storage'
import { findOrFail, findIndexOrFail, stringSort } from '../../../server/src/server/util/langutils'
import { apiVerify } from '../httputils'

interface Channel extends SubscriptionStorage {
  groupsInfo: ChannelGroup[]
}

interface MyData {
  channels: Channel[],
  groups: ChannelGroup[],
}

export default defineComponent({
  name: "ChannelsPage",
  data() {
    return {
      channels: [],
      groups: [],
    } as MyData
  },
  async mounted() {
    const groupsResponse = await fetch("http://127.0.0.1:3001/api/group")
    this.groups = await groupsResponse.json()

    const channelResponse = await fetch("http://127.0.0.1:3001/api/subscriptions")
    this.channels = await channelResponse.json()
    this.channels = this.channels.map(entry => {
      if (entry.groups) {
        entry.groupsInfo = entry.groups.split(",").map(groupNeedle => findOrFail(this.groups, e => e.groupName == groupNeedle));
        entry.groupsInfo.sort((a, b) => stringSort(a.groupName, b.groupName));
      } else {
        entry.groupsInfo = [];
      }
      return entry;
    })
  },
  methods: {
    removeChannelGroup(channelId: string, groupName: string) {
      const channel = findOrFail(this.$data.channels, e => e.channelId == channelId)
      if (channel.groups == undefined) {
        throw new Error("state error")
      }
      const groupIndex = findIndexOrFail(channel.groupsInfo, e => e.groupName == groupName)
      channel.groupsInfo.splice(groupIndex, 1)

      const fd = new FormData();
      fd.set("channelId", channelId)
      fd.set("groupName", groupName)
      fetch("http://127.0.0.1:3001/api/group/channel", {
        method: "DELETE",
        body: fd
      })
        .then(apiVerify)
        .catch(e => alert("failed to delete tag" + e))
    },
    addChannelGroup(channelId: string, event: Event) {
      if (!event.target) {
        throw new Error("state error")
      }
      const groupName = (event.target as HTMLSelectElement).value

      const channel = findOrFail(this.$data.channels, e => e.channelId == channelId)
      channel.groupsInfo.push(findOrFail(this.$data.groups, e => e.groupName == groupName))

      const fd = new FormData();
      fd.set("channelId", channelId)
      fd.set("groupName", groupName)
      fetch("http://127.0.0.1:3001/api/group/channel", {
        method: "POST",
        body: fd
      })
        .then(apiVerify)
        .catch(e => alert("failed to add tag" + e))
    }
  }
})
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