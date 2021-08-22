<template>
  <div id="subscriptions">
    <h1>Subscriptions</h1>
    <ul>
      <li v-for="subscription of subscriptions">
        <a href="https://www.youtube.com/channel/{{channelId}}">{{ subscription.channelName }}</a> -
        <div
          class="channel-tag"
          v-bind:style="'background-color: #' + group.color"
          v-for="group of subscription.groupsInfo"
        >
          {{ group.groupName }}
          <form
            class="group-channel-remove-form ajaxform"
            action="/api/group/channel"
            ajaxmethod="DELETE"
          >
            <input type="hidden" name="channelId" value="{{../channelId}}" />
            <input type="hidden" name="groupName" value="{{groupName}}" />
            <button type="submit" name="submit">x</button>
          </form>
        </div>,
        <form class="group-channel-add-form ajaxform" action="/api/group/channel" ajaxmethod="POST">
          <select name="groupName">
            <option value></option>
            <option value="{{groupName}}" v-for="group of groups">{{ group.groupName }}</option>
          </select>
          <input type="hidden" name="channelId" value="{{channelId}}" />
          <button type="submit" name="addChannelGroup">Add Group</button>
        </form>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
import { SubscriptionStorage, ChannelGroup } from '../../../server/src/server/util/storage'

interface MyData {
  subscriptions: SubscriptionStorage[],
  groups: ChannelGroup[],
}

export default defineComponent({
  name: "ChannelsPage",
  data() {
    return {
      subscriptions: [],
      groups: [],
    } as MyData
  },
  mounted() {
    fetch("http://127.0.0.1:3001/api/subscriptions")
      .then(res => res.json())
      .then(json => {
        this.subscriptions = json
      }).catch(e => {
        alert("failed to get subscriptions")
      })

    fetch("http://127.0.0.1:3001/api/group")
      .then(res => res.json())
      .then(json => {
        this.groups = json
      }).catch(e => {
        alert("failed to get subscriptions")
      })
  }
})
</script>

<style scoped>
</style>