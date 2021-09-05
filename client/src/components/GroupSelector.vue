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
        <li v-for="group of groupsAll">
          <label v-bind:style="getGroupColorStyle(group)">
            {{ group.groupName }}
            <input
              type="checkbox"
              v-bind:checked="isSelected(group.groupName)"
              @click="groupSelected(group.groupName)"
            />
          </label>
        </li>
        <li v-if="addNoneAllGroups">
          <label>
            All
            <input type="checkbox" name="magicAppliedForm" v-model="magicAll" />
          </label>
          <label>
            None
            <input
              type="checkbox"
              name="magicAppliedForm"
              v-model="magicNone"
            />
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
  GROUP_MAGIC_NONE,
} from "../../../server/src/common/util/storage";
import { alertAndThrow, apiGetData, changeQueryArray } from "../util/httputils";
import { getGroupColorStyle } from "../utils";

const NONE_GROUP: ChannelGroup = {
  groupName: GROUP_MAGIC_NONE,
  color: "000000",
};

// This doesn't make any sense on the db side, only for client UI tracking
const GROUP_MAGIC_ALL = "(all)";
const ALL_GROUP: ChannelGroup = {
  groupName: GROUP_MAGIC_ALL,
  color: "000000",
};

interface MyData {
  magicAll: boolean;
  magicNone: boolean;
}

export default defineComponent({
  name: "GroupSelector",
  // -- data
  props: {
    name: {
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
    addNoneAllGroups: {
      type: Boolean,
      required: true,
    },
    // If missing, don't set query parameters
    queryParameter: {
      type: String,
    },
  },
  data() {
    return {
      magicAll: false,
      magicNone: false,
    } as MyData;
  },
  // -- events
  async mounted() {
    this._paramsLoad();
  },
  computed: {
    groupsAll(): ChannelGroup[] {
      if (this.addNoneAllGroups) {
        const result = Array.from(this.groups);
        result.push(NONE_GROUP);
        result.push(ALL_GROUP);
        return result;
      } else {
        return this.groups;
      }
    },
  },
  emits: {
    newGroupsApplied: (payload: string[]) => payload,
    newGroups: (payload: ChannelGroup[]) => payload,
  },
  // -- methods
  methods: {
    getGroupColorStyle,
    /**
     * PARAMS: Init our state on new component
     */
    _paramsLoad() {
      if (this.queryParameter == undefined) {
        console.log("init disabled queryParameter");
        return;
      }

      // const query = this.$router.currentRoute.value.query;
      // if (this.queryParameter in query) {
      //   const value = query[this.queryParameter];
      //   if (value == GROUP_MAGIC_ALL) {
      //     this._groupAllSelected(true);
      //     console.log(
      //       "init set ALL to true"
      //     );
      //   } else if (value == GROUP_MAGIC_NONE) {
      //     this._groupAllSelected(false);
      //     console.log(
      //       "init set ALL to false"
      //     );
      //   } else {
      //     const selectedGroups = (value as string).split(",");
      //     console.log(
      //       "init loaded filters, emitting event " +
      //         this.queryParameter +
      //         " " +
      //         JSON.stringify(selectedGroups)
      //     );
      //   }
      //   if (this.selectedGroups.length > 0) {
      //     this.$emit("newGroupSelected", this.selectedGroups);
      //   }
      // } else if (this.initialAllSelected) {
      //   this.selectedGroups = this.groups.map((e) => e.groupName);
      //   console.log("init loaded all groups");
      // } else {
      //   console.log("init no groups selected");
      // }
    },
    /**
     * PARAMS: Update persisted state
     */
    _paramsUpdate() {
      if (this.queryParameter == undefined) {
        return;
      }

      // const query = { ...this.$router.currentRoute.value.query };

      // const isAllSelected = this.selectedGroups.length == this.groups.length;
      // const isNoneSelected = this.selectedGroups.length == 0;
      // if (isAllSelected || isNoneSelected) {
      //   if (
      //     (isAllSelected && this.initialAllSelected) ||
      //     (isNoneSelected && !this.initialAllSelected)
      //   ) {
      //     // we returned to default state
      //     delete query[this.queryParameter];
      //   } else {
      //     // we have inverted default state
      //     query[this.queryParameter] = VALUE_MAGIC_INVERTED_ALL;
      //   }
      // } else {
      //   // put what we selected in the list
      //   query[this.queryParameter] = this.selectedGroups.join(",");
      // }
      // this.$router.replace({ query });
    },
    /**
     * template util for checkbox
     */
    isSelected(groupName: string) {
      return this.groupsApplied.indexOf(groupName) != -1;
    },
    /**
     * FORM CHECKBOX: Update on checkbox value change
     */
    async groupSelected(groupName: string) {
      const groupsToApply = Array.from(this.groupsApplied);
      if (this.isSelected(groupName)) {
        // already selected, delete it
        groupsToApply.splice(
          findIndexOrFail(groupsToApply, (e) => e == groupName),
          1
        );
      } else {
        // add
        groupsToApply.push(groupName);
      }
      this.$emit("newGroupsApplied", groupsToApply);

      this._paramsUpdate();
    },
    /**
     * FORM BUTTON: Select All/None
     */
    async groupAllSelected(selected: boolean) {
      this._groupAllSelected(selected);
      this._paramsUpdate();
    },
    async _groupAllSelected(selected: boolean) {
      if (selected) {
        this.$emit(
          "newGroupsApplied",
          this.groups.map((e) => e.groupName)
        );
      } else {
        this.$emit("newGroupsApplied", []);
      }
    },
    async _checkAllNone() {
      if (!this.addNoneAllGroups) {
        return;
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
