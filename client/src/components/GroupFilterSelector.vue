<template>
  <form>
    <div>
      <label>
        Groups
        <select v-model="groupFilterSelected">
          <option></option>
          <option
            v-for="group in groupFilterAvailable"
            :style="'background-color: #' + group.color"
          >
            {{ group.groupName }}
          </option>
        </select>
      </label>
      <button type="button" @click="groupFilterApply(true, $event)">
        Include
      </button>
      <button type="button" @click="groupFilterApply(false, $event)">
        Exclude
      </button>
      <ul>
        <li v-for="group of groupFilterApplied">
          <button
            type="button"
            alt="Remove"
            @click="groupFilterRemove(group.name)"
          >
            x
          </button>
          {{ group.included ? "+" : "-" }} {{ group.name }}
        </li>
      </ul>
    </div>
  </form>
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
  groupFilterApplied: GroupFilter[];
  groupFilterSelected: string;
}

export default defineComponent({
  name: "GroupFilterSelector",
  // -- data
  props: {
    initialGroups: {
      type: Object as PropType<ChannelGroup[]>,
    },
  },
  data() {
    return {
      groups: [],
      groupFilterApplied: [],
      groupFilterSelected: "",
    } as MyData;
  },
  computed: {
    groupFilterAvailable(): ChannelGroup[] {
      return this.groups.filter((e) => {
        for (const applied of this.groupFilterApplied) {
          if (applied.name == e.groupName) {
            return false;
          }
        }
        return true;
      });
    },
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
    newGroupFilter: (payload: GroupFilter[] ) => payload,
    newGroups: (payload: ChannelGroup[] ) => payload,
  },
  // -- methods
  methods: {
    /**
     * Load config from query paramters
     */
    _loadParams() {
      const query = this.$router.currentRoute.value.query;
      if ("groupInclude" in query) {
        for (const groupName of (query["groupInclude"] as string).split(",")) {
          if (this.groupFilterApplied.find((e) => e.name == groupName) == undefined) {
            this.groupFilterApplied.push({
              name: groupName,
              included: true,
            });
          }
        }
      }
      if ("groupExclude" in query) {
        for (const groupName of (query["groupExclude"] as string).split(",")) {
          if (this.groupFilterApplied.find((e) => e.name == groupName) == undefined) {
            this.groupFilterApplied.push({
              name: groupName,
              included: false,
            });
          }
        }
      }
      console.log("loaded filters " + JSON.stringify(this.groupFilterApplied))
      if (this.groupFilterApplied.length > 0) {
        this.$emit("newGroupFilter", this.groupFilterApplied );
      }
    },
    /**
     * Add new group filter entry
     */
    async groupFilterApply(included: boolean, event: MouseEvent) {
      if (this.groupFilterSelected == "") {
        alert("no element selected");
        return;
      }

      this.groupFilterApplied.push({
        name: this.groupFilterSelected,
        included,
      });

      const query = { ...this.$router.currentRoute.value.query };
      changeQueryArray(
        query,
        included ? "groupInclude" : "groupExclude",
        this.groupFilterSelected,
        true
      );
      this.$router.replace({ query });

      this.$emit("newGroupFilter", this.groupFilterApplied );

      this.groupFilterSelected = "";
    },
    /**
     * Delete group filter entry
     */
    groupFilterRemove(name: string) {
      const groupIndex = findIndexOrFail(this.groupFilterApplied, (e) => e.name == name);
      const group = this.groupFilterApplied[groupIndex];
      this.groupFilterApplied.splice(groupIndex, 1);

      const query = { ...this.$router.currentRoute.value.query };
      changeQueryArray(
        query,
        group.included ? "groupInclude" : "groupExclude",
        group.name,
        false
      );
      this.$router.replace({ query });

      this.$emit("newGroupFilter", this.groupFilterApplied);
    },
  },
});
</script>
