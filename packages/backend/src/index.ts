import type { DefineAPI, SDK } from "caido:plugin";
import type { ID } from "caido:utils";

type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

type RequestConnectionInfo = {
  host: string;
  isTls: boolean;
  port: number;
};

const generateRandomString = (sdk: SDK, length: number) => {
  const randomString = Math.random()
    .toString(36)
    .substring(2, length + 2);
  sdk.console.log(`Generating random string: ${randomString}`);
  return randomString;
};

const getRequestConnectionInfo = async (
  sdk: SDK,
  requestId: ID,
): Promise<Result<RequestConnectionInfo>> => {
  const requestResponse = await sdk.requests.get(requestId);
  if (requestResponse === undefined) {
    return { kind: "Error", error: "Request not found" };
  }

  return {
    kind: "Ok",
    value: {
      host: requestResponse.request.getHost(),
      isTls: requestResponse.request.getTls(),
      port: requestResponse.request.getPort(),
    },
  };
};

export type API = DefineAPI<{
  generateRandomString: typeof generateRandomString;
  getRequestConnectionInfo: typeof getRequestConnectionInfo;
}>;

export function init(sdk: SDK<API>) {
  sdk.api.register("generateRandomString", generateRandomString);
  sdk.api.register("getRequestConnectionInfo", getRequestConnectionInfo);
}
