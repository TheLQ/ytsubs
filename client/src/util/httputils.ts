import { WrappedError } from "../../../server/src/common/util/error";

/**
 * send json to api call, api call returns json on success
 */
export async function apiSendData(
  method: string,
  path: string,
  reqJson: any
): Promise<any> {
  const res = await fetch("http://127.0.0.1:3001" + path, {
    headers: {
      "content-type": "application/json",
    },
    method,
    body: JSON.stringify(reqJson),
  });
  return await readJson(res);
}

/**
 * api call returns json on success
 */
export async function apiGetData(method: string, path: string): Promise<any> {
  const res = await fetch("http://127.0.0.1:3001" + path, {
    method,
  });
  return await readJson(res);
}

async function readJson(res: Response) {
  const body = await res.text();

  let json;
  if (body == "") {
    throw new Error("Body is empty");
  }
  try {
    json = JSON.parse(body);
  } catch (e) {
    throw new WrappedError(
      "failed to parse response, body follows\r\n" + body,
      e
    );
  }

  return json;
}

/**
 * api call returns 1 on success
 */
export async function apiAction(method: string, path: string): Promise<void> {
  const res = await fetch("http://127.0.0.1:3001" + path, {
    method,
  });
  const body = await res.text();
  if (body != "1") {
    throw new Error("call unsuccessful\n" + body);
  }
}

export function alertAndThrow(e: any, message: string) {
  const eString = e.toString ? e.toString() : e;

  alert(message + "\n" + e);
  throw e;
}
