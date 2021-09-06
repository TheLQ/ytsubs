<template>
  <div class="channel-tag-wrapper">
    <form v-if="addDisplayed">
      <button
        alt="Add tag"
        type="button"
        @click="toggleFormDisplayed()"
        :disabled="toggleSavingCounter != 0"
      >
        <template v-if="toggleSavingCounter == 0"> {{ toggleValue }} </template>
        <template v-else>Saving... {{ toggleSavingCounter }}</template>
      </button>

      <span
        class="channel-tag"
        v-for="group of groupsAppliedObjects"
        :style="getGroupColorStyle(group)"
      >
        {{ group.groupName }}
      </span>

      <div v-if="formDisplayed">
        <GroupSelector
          name="Set Channel Groups"
          :groups-applied="groupsApplied"
          :add-none-all-groups="false"
          @new-groups-applied="onGroupSelectorUpdate($event)"
        />
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
  promiseAllThrow,
  removeOrFail,
} from "../../../server/src/common/util/langutils";
import { ActionTypes, MutationTypes } from "../VueStore";
import { apiAction, apiSendData } from "../util/httputils";
import { apiChannelGroup } from "../../../server/src/common/routes/ApiChannelRoute";

const toggleValueClose = "Close";
const toggleValueOpen = "x";

interface MyData {
  toggleValue: string;
  toggleSavingCounter: number;
  formDisplayed: boolean;
}

export interface MappingEvent {
  channelId: string;
  group: string;
  adding: boolean;
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
      toggleValue: toggleValueOpen,
      toggleSavingCounter: 0,
      formDisplayed: false,
    } as MyData;
  },
  computed: {
    groupsAppliedObjects() {
      // console.log("groupsApplied" + JSON.stringify(this.groupsApplied));
      return this.groupsApplied.map((name) => {
        // console.log("finding group " + name + " in " + JSON.stringify(this.groupsApplied));
        const res = findOrFail(
          this.$store.state.groups,
          (group) => group.groupName == name
        );
        // console.log("done finding group " + name + " in " + JSON.stringify(this.groupsApplied));
        return res;
      });
    },
  },
  emits: {
    mappingEvent: (payload: MappingEvent) => payload,
    newGroups: (payload: ChannelGroup[]) => payload,
  },
  methods: {
    getGroupColorStyle,
    /**
     * hide or show form
     */
    toggleFormDisplayed() {
      if (this.formDisplayed) {
        this.formDisplayed = false;
        this.toggleValue = toggleValueOpen;
      } else {
        this.formDisplayed = true;
        this.toggleValue = toggleValueClose;
      }
    },
    /**
     * immediately persist any change in checkbox
     */
    async onGroupSelectorUpdate(groups: string[]) {
      console.log("calling on update");
      // 2 stage diff, could have multiple changes
      const groupsAppliedPrevious = Array.from(this.groupsApplied);
      const promiseQueue: Promise<void>[] = [];
      for (const group of groups) {
        if (groupsAppliedPrevious.indexOf(group) == -1) {
          this.toggleSavingCounter++;
          const apiResult = apiAction(
            "PUT",
            apiChannelGroup(this.channelId, group)
          );
          apiResult.then(() => {
            this.toggleSavingCounter--;
            this.$emit("mappingEvent", {
              channelId: this.channelId,
              group: group,
              adding: true,
            });
          });
          promiseQueue.push(apiResult);
        }
      }
      for (const group of groupsAppliedPrevious) {
        if (groups.indexOf(group) == -1) {
          this.toggleSavingCounter++;
          const apiResult = apiAction(
            "DELETE",
            apiChannelGroup(this.channelId, group)
          );
          apiResult.then(() => {
            this.toggleSavingCounter--;
            this.$emit("mappingEvent", {
              channelId: this.channelId,
              group: group,
              adding: false,
            });
          });
          promiseQueue.push(apiResult);
        }
      }

      await promiseAllThrow(promiseQueue, "could not save groups");
      this.toggleValue = toggleValueClose;
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

.channel-tag {
  display: inline;
  border: 1px solid black;
}
</style>
