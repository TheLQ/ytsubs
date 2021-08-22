<template>
  <h1>Hello App!</h1>
  <p>
    <router-link to="/">Videos</router-link>
    <router-link to="/channels">Channels</router-link>
  </p>
  <div id="content">
    <router-view></router-view>
  </div>
  
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import VideosPage from './VideosPage.vue'
import ChannelsPage from './ChannelsPage.vue'

export default defineComponent({
  name: 'App',
  components: {
    VideosPage,
    ChannelsPage,
  }
})
</script>

<style>
#app {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

#content {
  display: flex;
  flex-wrap: wrap;
}
</style>
