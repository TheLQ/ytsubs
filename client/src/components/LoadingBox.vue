<template>
  <div v-if="!isLoadingDone($store)">
    <h1>Loading...</h1>
    <ul>
      <li v-for="entry of messages" :class="entry.done ? 'message-done' : ''">
        {{ entry.message }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";
import { YsStore } from "../VueStore";

export function isLoadingDone(store: YsStore): boolean {
  return store.state.loadingProgress.length == 0;
}

export default defineComponent({
  name: "LoadingBox",
  //
  // data
  //
  computed: {
    messages() {
      return this.$store.state.loadingProgress
    }
  },
  methods: {
    isLoadingDone,
  }
});
</script>

<style>
.message-done {
  text-decoration: line-through;
}
</style>
