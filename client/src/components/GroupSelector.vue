<template>
  <fieldset>
    <div>
      Groups
      <ul>
        <li v-for="group of groups">
          <label v-bind:style="'background-color: #' + group.color">
            {{ group.groupName }}
            <input type="checkbox" v-bind:checked="isSelected(group.groupName)" @click="selectGroup(group.groupName)" />
          </label>
        </li>
      </ul>
    </div>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { GET_API_GROUP } from "../../../server/src/common/routes/ApiGroupRoute";
import { findIndexOrFail } from "../../../server/src/common/util/langutils";
import {
  ChannelGroup,
  GroupFilter,
} from "../../../server/src/common/util/storage";
import { alertAndThrow, apiGetData, changeQueryArray } from "../util/httputils";

interface MyData {
  groups: ChannelGroup[];
  selectedGroups: string[];
}

export default defineComponent({
  name: "GroupSelector",
  // -- data
  props: {
    name: {
      type: String,
      default: "groups"
    },
    initialGroups: {
      type: Object as PropType<ChannelGroup[]>,
    },
    queryParameter: {
      type: String,
      default: "groups"
    }
  },
  data() {
    return {
      groups: [],
      selectedGroups: [],
    } as MyData;
  },
  // -- events
  async mounted() {
    if (this.initialGroups !== undefined) {
      this.groups = this.initialGroups;
    } else {
      try {
        const groups = (await apiGetData(
          "GET",
          GET_API_GROUP
        )) as ChannelGroup[];
        this.groups = groups;
      } catch (e) {
        alertAndThrow(e, "failed to get groups");
        return;
      }
      this.$emit("newGroups", this.groups);
    }

    this._loadParams();
  },
  emits: {
    newGroupSelected: (payload: string[] ) => payload,
    newGroups: (payload: ChannelGroup[] ) => payload,
  },
  // -- methods
  methods: {
    /**
     * Load config from query paramters
     */
    _loadParams() {
      const query = this.$router.currentRoute.value.query;
      if (this.queryParameter in query) {
        this.selectedGroups = (query[this.queryParameter] as string).split(",");
      }
      console.log("loaded filters " + this.queryParameter + " " + JSON.stringify(this.selectedGroups))
      if (this.selectedGroups.length > 0) {
        this.$emit("newGroupSelected", this.selectedGroups );
      }
    },
    isSelected(groupName: string) {
      return this.selectedGroups.indexOf(groupName) != -1
    },
    /**
     * Add new group filter entry
     */
    async selectGroup(groupName: string) {
      const selected = this.selectedGroups.indexOf(groupName) != -1;

      if (selected) {
        this.selectedGroups.splice(findIndexOrFail(this.selectedGroups, e => e == groupName), 1)
      } else {
        this.selectedGroups.push(groupName)
      }

      const query = { ...this.$router.currentRoute.value.query };
      changeQueryArray(
        query,
        this.queryParameter,
        groupName,
        !selected
      );
      this.$router.replace({ query });

      this.$emit("newGroupSelected", this.selectedGroups );
    },
  },
});
</script>
