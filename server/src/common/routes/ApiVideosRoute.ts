import { GroupFilter } from "../util/storage";

export const POST_API_VIDEOS = "/api/videos";

export interface VideosRequest {
  groups?: GroupFilter[];
}
