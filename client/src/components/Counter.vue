<template>
  <code>we are {{ counter }}</code>
  <button v-on:click="inc">clicker</button>
</template>

<script lang="ts">
  import {getElement} from  "../../../../ytsubs/src/utils/xmlUtils"

  import { ref, defineComponent } from 'vue'
  export default defineComponent({
    name: "mycounter",
    data: () => {
      return {
        counter: 0
      }
    },
    // props: {
    //   counter: 0,
    // },
    methods: {
      inc() {
        this.counter++
      }
    }
  })
</script>

<style scoped>
code {
  background-color: blue;
}
</style>