<template>
  <div class="channel-tag-wrapper">
    <span
      class="channel-tag"
      v-for="group of groupsFiltered"
      :style="getGroupColorStyle(group)"
    >
      {{ group.groupName }}
    </span>

    <form v-if="addDisplayed">
      <button alt="Add tag" type="button" @click="toggleFormDisplayed()">
        +
      </button>

      <div v-if="formDisplayed">
        <GroupSelector
          name="Set Channel Groups"
          :groups="groups"
          :groups-applied="groupsAppliedWorking"
          :add-none-all-groups="false"
          @new-groups-applied="onFormGroupUpdate($event)"
        />
        <!-- @new-groups="$emit('newGroups', $event)" -->

        <button type="submit" @click.prevent="apply()">
          Submit New Groups
        </button>
        <button type="button" @click="toggleFormDisplayed()">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import GroupSelector from "./GroupSelector.vue";
import { ref, defineComponent, PropType } from "vue";
import {
  ChannelGroup,
  VideoStorage,
} from "../../../server/src/common/util/storage";
import { getGroupColorStyle } from "../utils";
import {
  copyArray,
  findOrFail,
} from "../../../server/src/common/util/langutils";

interface MyData {
  formDisplayed: boolean;
  groupsAppliedWorking: string[];
}

export interface NewMappingEvent {
  channelId: string;
  groups: string[];
}

export default defineComponent({
  name: "GroupAddForm",
  components: {
    GroupSelector,
  },
  props: {
    channelId: {
      type: String,
      required: true,
    },
    groups: {
      type: Object as PropType<ChannelGroup[]>,
      required: true,
    },
    groupsApplied: {
      type: Object as PropType<string[]>,
      required: true,
    },
    addDisplayed: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      formDisplayed: false,
      groupsAppliedWorking: [],
    } as MyData;
  },
  computed: {
    groupsFiltered() {
      console.log("groupsApplied" + JSON.stringify(this.groupsApplied));
      return this.groupsApplied.map((name) => {
        console.log("finding group " + name);
        const res = findOrFail(this.groups, (group) => group.groupName == name);
        console.log("done finding group " + name);
        return res;
      });
    },
  },
  emits: {
    newChannelGroupMapping: (payload: NewMappingEvent) => payload,
    newGroups: (payload: ChannelGroup[]) => payload,
  },
  methods: {
    getGroupColorStyle,
    // groupAddFormGroupsUpdate(groups: string[]) {
    //   this.groupAddFormGroups = groups;
    // },
    apply() {
      console.log(
        "groupsAppliedWorking" + JSON.stringify(this.groupsAppliedWorking)
      );
      this.$emit("newChannelGroupMapping", {
        channelId: this.channelId,
        groups: this.groupsAppliedWorking,
      });

      // reset
      this.toggleFormDisplayed();
    },
    toggleFormDisplayed() {
      if (this.formDisplayed) {
        this.formDisplayed = false;
      } else {
        this.formDisplayed = true;

        this.groupsAppliedWorking.length = 0;
        copyArray(this.groupsApplied, this.groupsAppliedWorking);
      }
    },
    onFormGroupUpdate(groups: string[]) {
      this.groupsApplied.length = 0;
      copyArray(groups, this.groupsApplied);
    },
  },
});
</script>

<style>
.channel-tag-wrapper {
  display: inline;
  margin-left: 1em;
}

.channel-tag-wrapper form {
  display: inline;
}
</style>
