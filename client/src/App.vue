<template>
  <Videos/>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Videos from './components/Videos.vue'
import Counter from './components/Counter.vue'

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
}
</style>
