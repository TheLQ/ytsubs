import {
  ActionContext,
  ActionTree,
  CommitOptions,
  createStore,
  DispatchOptions,
  MutationTree,
  Store as base_Store,
  useStore as base_UseStore,
} from "vuex";
import {
  ChannelGroup,
  ChannelGroupMapping,
} from "../../server/src/common/util/storage";
import { GET_API_GROUP } from "../../server/src/common/routes/ApiGroupRoute";
import { apiGetData, alertAndThrow } from "./util/httputils";
import { InjectionKey } from "vue";
import {
  copyArray,
  findOrFail,
  removeOrFail,
  stringSort,
  assertNotBlank,
} from "../../server/src/common/util/langutils";
import { invokeArrayFns } from "@vue/shared";

/*
 * Typesafe Vuex Store
 *
 * Important code inside of the typescript spagetti boilerplate
 * - const mutations
 * - const actions
 * - const store state()
 *
 * TODO: Some mutations/actions don't require parameters. However just ? can ignore required parameters
 * Just set the type to undefined...
 *
 * Thanks to https://dev.to/3vilarthas/vuex-typescript-m4j
 */

//
// State
//

/**
 * main state object
 */
export interface YsState {
  groups: ChannelGroup[];
  groupMappings: ChannelGroupMapping[];
  loadingProgress: LoadingEntry[];
  youtube: YoutubeState;
}

export interface LoadingEntry {
  message: string;
  done: boolean;
}

export interface YoutubeState {
  signedIn: boolean;
  name: string;
  profileImage: string;
}

//
// Mutation
//

/**
 * Mutation keys
 */
export enum MutationTypes {
  GROUP_ADD = "GROUP_ADD",
  GROUP_DELETE = "GROUP_DELETE",
  GROUP_COLOR = "GROUP_COLOR",
  GROUP_MAPPINGS_ADD = "GROUP_MAPPINGS_ADD",
  LOADING_ADD = "LOADING_ADD",
  LOADING_DONE = "LOADING_DONE",
  YOUTUBE_SIGNIN = "YOUTUBE_SIGNIN",
  YOUTUBE_SIGNOUT = "YOUTUBE_SIGNOUT",
}

/**
 * Mutation type definition
 */
type Mutations<S = YsState> = {
  [MutationTypes.GROUP_ADD](state: S, payload: ChannelGroup[]): void;
  [MutationTypes.GROUP_DELETE](state: S, groupName: string): void;
  [MutationTypes.GROUP_COLOR](state: S, payload: GroupColorPayload): void;
  [MutationTypes.GROUP_MAPPINGS_ADD](
    state: S,
    payload: ChannelGroupMapping[]
  ): void;
  [MutationTypes.LOADING_ADD](state: S, message: string): void;
  [MutationTypes.LOADING_DONE](state: S, message: string): void;
  [MutationTypes.YOUTUBE_SIGNIN](state: S, payload: YoutubeState): void;
  [MutationTypes.YOUTUBE_SIGNOUT](state: S, payload: undefined): void;
};
interface GroupColorPayload {
  group: string;
  color: string;
}

/**
 * Mutation implementation
 */
const mutations: MutationTree<YsState> & Mutations = {
  [MutationTypes.GROUP_ADD](state, payload: ChannelGroup[]): void {
    copyArray(payload, state.groups);
    state.groups.sort((a, b) => stringSort(a.groupName, b.groupName));
  },
  [MutationTypes.GROUP_DELETE](state, groupName: string): void {
    removeOrFail(state.groups, (e) => e.groupName == groupName);
  },
  [MutationTypes.GROUP_COLOR](state, payload: GroupColorPayload): void {
    const group = findOrFail(state.groups, (e) => e.groupName == payload.group);
    group.color = payload.color;
  },
  [MutationTypes.GROUP_MAPPINGS_ADD](
    state,
    payload: ChannelGroupMapping[]
  ): void {
    copyArray(payload, state.groupMappings);
  },
  [MutationTypes.LOADING_ADD](state, message: string): void {
    console.info("LOADING ADD: " + message);
    // insert at start so (theoretically) latest long-running task is at the top
    state.loadingProgress.splice(0, 0, {
      message,
      done: false,
    });
  },
  [MutationTypes.LOADING_DONE](state, message: string): void {
    const entry = findOrFail(
      state.loadingProgress,
      (e) => e.message == message
    );
    entry.done = true;

    let numDone = 0;
    for (const entry of state.loadingProgress) {
      if (entry.done) {
        numDone++;
      }
    }
    const numTotal = state.loadingProgress.length;
    if (numDone == numTotal) {
      state.loadingProgress.length = 0;
    }
    console.info(`LOADING DONE (${numDone}/${numTotal}): ${message}`);
  },
  [MutationTypes.YOUTUBE_SIGNIN](state, payload: YoutubeState): void {
    state.youtube = payload;
  },
  [MutationTypes.YOUTUBE_SIGNOUT](state, payload: undefined): void {
    state.youtube.signedIn = false;
    state.youtube.name = "";
  },
};

//
// Actions
//

/**
 * Action keys
 */
export enum ActionTypes {
  GROUPS_LOAD = "GROUPS_LOAD",
  GROUP_MAPPINGS_LOAD = "GROUP_MAPPINGS_LOAD",
}

/**
 * Action context parameter
 */
type AugmentedActionContext = Omit<
  ActionContext<YsState, YsState>,
  "commit"
> & {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1]
  ): ReturnType<Mutations[K]>;
};

/**
 * Action type definition
 */
interface Actions {
  [ActionTypes.GROUPS_LOAD](
    context: AugmentedActionContext,
    loadingMessage: string
  ): Promise<void>;
  [ActionTypes.GROUP_MAPPINGS_LOAD](
    context: AugmentedActionContext,
    payload: undefined
  ): void;
}

/**
 * Action implementation
 */
const actions: ActionTree<YsState, YsState> & Actions = {
  async [ActionTypes.GROUPS_LOAD]({ commit }, loadingMessage: string) {
    commit(MutationTypes.LOADING_ADD, loadingMessage);
    commit(MutationTypes.GROUP_ADD, await _loadGroups());
    commit(MutationTypes.LOADING_DONE, loadingMessage);
  },
  [ActionTypes.GROUP_MAPPINGS_LOAD]({ commit }) {
    // commit(MutationTypes.ADD_GROUPS, "asd");
  },
};

export async function _loadGroups() {
  try {
    const groups = (await apiGetData("GET", GET_API_GROUP)) as ChannelGroup[];
    console.log("groups", groups);
    return groups;
  } catch (e) {
    throw alertAndThrow(e, "failed to get groups");
  }
}

//
// Assembled Store typescript boilerplate
//

/**
 * Replace with our state types
 */
export type YsStore = Omit<
  base_Store<YsState>,
  /*'getters' | */ "commit" | "dispatch"
> & {
  commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
    key: K,
    payload: P,
    options?: CommitOptions
  ): ReturnType<Mutations[K]>;
} & {
  dispatch<K extends keyof Actions>(
    key: K,
    payload: Parameters<Actions[K]>[1],
    options?: DispatchOptions
  ): ReturnType<Actions[K]>;
};
/*& {
  getters: {
    [K in keyof Getters]: ReturnType<Getters[K]>
  }
}*/

// Typescript boilerplate
export const storeKey: InjectionKey<YsStore> = Symbol();
export function useStore(): YsStore {
  return base_UseStore(storeKey);
}

export const store: YsStore = createStore<YsState>({
  state() {
    return {
      groups: [],
      groupMappings: [],
      loadingProgress: [],
      youtube: {
        signedIn: false,
        name: "",
        profileImage: "",
      },
    };
  },
  mutations,
  actions,
});
