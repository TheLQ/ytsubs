export const POST_API_VIDEOS = "/api/videos"

export interface VideosRequest {
  groups: GroupFilter[] | undefined
}

export interface GroupFilter {
  name: string;
  included: boolean;
}

