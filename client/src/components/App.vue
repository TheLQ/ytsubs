<template>
  <h1>Hello App!</h1>
  <p>
    <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p>
  <div id="content">
    <router-view></router-view>
  </div>
  
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Videos from './Videos.vue'
import Counter from './Counter.vue'

export default defineComponent({
  name: 'App',
  components: {
    Videos,
    Counter
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
