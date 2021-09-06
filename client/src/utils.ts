import { findOrFail } from "../../server/src/common/util/langutils";

import { ChannelGroup } from "../../server/src/common/util/storage";

export function findGroupColorStyle(
  groups: ChannelGroup[],
  name: string
): string {
  const group = findOrFail(groups, (e) => e.groupName == name);
  return getGroupColorStyle(group);
}

export function getGroupColorStyle(group: ChannelGroup): string {
  if (group.color != null) {
    return "background-color: #" + group.color;
  } else {
    return "";
  }
}

export function assertNotBlank(value: any, errorMessage: string): string {
  if (
    value == null ||
    value == undefined ||
    typeof value != "string" ||
    value.trim() == ""
  ) {
    throw new Error(errorMessage + " value " + value);
  }
  return value;
}
