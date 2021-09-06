import { LocationQuery } from "vue-router";
import { WrappedError } from "../../../server/src/common/util/error";
import { removeOrFail } from "../../../server/src/common/util/langutils";

const backendServer = import.meta.env.VITE_API_URL;
console.log("backend server", backendServer);
if (backendServer == undefined) {
  throw new Error("init fail no backend server");
}

/**
 * send json to api call, api call returns json on success
 */
export async function apiSendData(
  method: string,
  path: string,
  reqJson: any
): Promise<any> {
  console.info(
    `API SendData ${method} ${path}`,
    JSON.parse(JSON.stringify(reqJson))
  );
  const res = await fetch(backendServer + path, {
    headers: {
      "content-type": "application/json",
    },
    method,
    body: JSON.stringify(reqJson),
  });
  await assertCode200(res);
  return await readJson(res);
}

/**
 * api call returns json on success
 */
export async function apiGetData(method: string, path: string): Promise<any> {
  console.info(`API GetData ${method} ${path}`);
  const res = await fetch(backendServer + path, {
    method,
  });
  await assertCode200(res);
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
  console.info(`API Action ${method} ${path}`);
  const res = await fetch(backendServer + path, {
    method,
  });
  await assertCode200(res);
  const body = await res.text();
  if (body != "1") {
    throw new Error("call unsuccessful\n" + body);
  }
}

async function assertCode200(res: Response) {
  if (res.status != 200) {
    const body = await res.text();
    throw new Error("received error " + res.status + " body " + body);
  }
}

export function alertAndThrow(e: any, message: string) {
  const eString = e.toString ? e.toString() : e;

  const failMessage = message + "\n" + eString;
  console.error("ALERT " + failMessage);
  alert(failMessage);
  throw e;
}

export function changeQueryArray(
  query: LocationQuery,
  key: string,
  value: string,
  add: boolean
) {
  let rawValue = "";
  if (Object.prototype.hasOwnProperty.call(query, key)) {
    rawValue = query[key] as string;
  }

  let arr = rawValue != "" ? rawValue.split(",") : [];
  if (add) {
    arr.push(value);
  } else {
    removeOrFail(arr, (e) => e == value);
  }

  if (arr.length != 0) {
    query[key] = arr.join(",");
  } else {
    delete query[key];
  }
}
