export const ARG_GROUP_NAME = "groupName";
export const ARG_COLOR = "color";

export const GET_API_GROUP = "/api/group";

export const API_GROUP = `/api/group/:${ARG_GROUP_NAME}`;
export function apiGroup(groupName: string) {
  return API_GROUP.replace(":" + ARG_GROUP_NAME, groupName);
}

export const API_GROUP_COLOR = `/api/group/:${ARG_GROUP_NAME}/color/:${ARG_COLOR}`;
export function apiGroupColor(groupName: string, color: string) {
  return API_GROUP.replace(":" + ARG_GROUP_NAME, groupName).replace(
    ":" + ARG_COLOR,
    color
  );
}
