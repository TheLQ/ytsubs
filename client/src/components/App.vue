<template>
  <h1>Hello App!</h1>
  <p>
    <router-link to="/">Videos</router-link>
    <router-link to="/subscriptions">Subscriptions</router-link>
  </p>
  <div id="content">
    <router-view></router-view>
  </div>
  
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Videos from './Videos.vue'
import Subscriptions from './Subscriptions.vue'

export default defineComponent({
  name: 'App',
  components: {
    Videos,
    Subscriptions,
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
