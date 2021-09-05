import { YsStore } from "../VueStore";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: YsStore;
  }
}
