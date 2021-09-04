<!--
  Group super selector component
  - List of groups
  - Checkboxes for each group
  - Buttons to select all/none checkbox
  - Manage query parameter
  - (TODO) Add new tag
  - (TODO) 
-->

<template>
  <fieldset>
    <legend>{{ name }}</legend>
    <div>
      <ul class="groupsList">
        <li v-for="group of groups">
          <label v-bind:style="'background-color: #' + group.color">
            {{ group.groupName }}
            <input
              type="checkbox"
              v-bind:checked="isSelected(group.groupName)"
              @click="groupSelected(group.groupName)"
            />
          </label>
        </li>
      </ul>
      <!-- autocomplete=off to avoid firefox caching state per docs (nessesary?) -->
      <button
        type="button"
        autocomplete="off"
        @click="groupAllSelected(true)"
        v-bind:disabled="selectedGroups.length == groups.length"
      >
        All
      </button>
      <button
        type="button"
        autocomplete="off"
        @click="groupAllSelected(false)"
        v-bind:disabled="selectedGroups.length == 0"
      >
        None
      </button>
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
  GROUP_MAGIC_NONE,
} from "../../../server/src/common/util/storage";
import { alertAndThrow, apiGetData, changeQueryArray } from "../util/httputils";

interface MyData {
  groups: ChannelGroup[];
  selectedGroups: string[];
}

const NONE_GROUP: ChannelGroup = {
  groupName: GROUP_MAGIC_NONE,
  // pure red
  color: "FF0000",
};

const VALUE_MAGIC_INVERTED_ALL = "_INV";

export default defineComponent({
  name: "GroupSelector",
  // -- data
  props: {
    name: {
      type: String,
      required: true,
    },
    initialAllSelected: {
      type: Boolean,
      required: true,
    },
    addNoneGroup: {
      type: Boolean,
      required: true,
    },
    // If missing, load from API
    initialGroups: {
      type: Object as PropType<ChannelGroup[]>,
    },
    // If missing, don't set query parameters
    queryParameter: {
      type: String,
    },
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
      if (
        this.addNoneGroup &&
        this.groups.find((e) => e.groupName == GROUP_MAGIC_NONE) == undefined
      ) {
        this.groups.push(NONE_GROUP);
      }
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
      if (this.addNoneGroup) {
        this.groups.push(NONE_GROUP);
      }
      this.$emit("newGroups", this.groups);
    }

    this._paramsLoad();
  },
  emits: {
    newGroupSelected: (payload: string[]) => payload,
    newGroups: (payload: ChannelGroup[]) => payload,
  },
  // -- methods
  methods: {
    /**
     * PARAMS: Init our state on new component
     */
    _paramsLoad() {
      if (this.queryParameter == undefined) {
        console.log("init disabled queryParameter");
        return;
      }

      const query = this.$router.currentRoute.value.query;
      if (this.queryParameter in query) {
        const value = query[this.queryParameter];
        if (value == VALUE_MAGIC_INVERTED_ALL) {
          this._groupAllSelected(!this.initialAllSelected);
          console.log(
            "init set ALL inverted of default " + this.initialAllSelected
          );
        } else {
          this.selectedGroups = (value as string).split(",");
          console.log(
            "init loaded filters " +
              this.queryParameter +
              " " +
              JSON.stringify(this.selectedGroups)
          );
        }
        if (this.selectedGroups.length > 0) {
          this.$emit("newGroupSelected", this.selectedGroups);
        }
      } else if (this.initialAllSelected) {
        this.selectedGroups = this.groups.map((e) => e.groupName);
        console.log("init loaded all groups");
      } else {
        console.log("init no groups selected");
      }
    },
    /**
     * PARAMS: Update persisted state
     */
    _paramsUpdate() {
      if (this.queryParameter == undefined) {
        return;
      }

      const query = { ...this.$router.currentRoute.value.query };

      const isAllSelected = this.selectedGroups.length == this.groups.length;
      const isNoneSelected = this.selectedGroups.length == 0;
      if (isAllSelected || isNoneSelected) {
        if (
          (isAllSelected && this.initialAllSelected) ||
          (isNoneSelected && !this.initialAllSelected)
        ) {
          // we returned to default state
          delete query[this.queryParameter];
        } else {
          // we have inverted default state
          query[this.queryParameter] = VALUE_MAGIC_INVERTED_ALL;
        }
      } else {
        // put what we selected in the list
        query[this.queryParameter] = this.selectedGroups.join(",");
      }
      this.$router.replace({ query });
    },
    /**
     * template util for checkbox
     */
    isSelected(groupName: string) {
      return this.selectedGroups.indexOf(groupName) != -1;
    },
    /**
     * FORM CHECKBOX: Update on checkbox value change
     */
    async groupSelected(groupName: string) {
      const selected = this.selectedGroups.indexOf(groupName) != -1;

      if (selected) {
        this.selectedGroups.splice(
          findIndexOrFail(this.selectedGroups, (e) => e == groupName),
          1
        );
      } else {
        this.selectedGroups.push(groupName);
      }

      this._paramsUpdate();
      this.$emit("newGroupSelected", this.selectedGroups);
    },
    /**
     * FORM BUTTON: Select All/None
     */
    async groupAllSelected(selected: boolean) {
      this._groupAllSelected(selected);

      this._paramsUpdate();
      this.$emit("newGroupSelected", this.selectedGroups);
    },
    async _groupAllSelected(selected: boolean) {
      if (selected) {
        this.selectedGroups = this.groups.map((e) => e.groupName);
      } else {
        this.selectedGroups.length = 0;
      }
    },
  },
});
</script>

<style>
.groupsList {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
