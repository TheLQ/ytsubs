import formidable from "formidable";
import { reload } from "../templates";
import logger from "../util/logger";

const log = logger("server/routes/DebugRoute");

export async function doDebugWork(fields: formidable.Fields): Promise<boolean> {
  if (fields.reloadTemplate !== undefined) {
    log.silly("reloading templates");
    await reload();
    return true;
  } else {
    return false;
  }
}
