import type { FrontendSDK } from "@/types";

import {
  buildReplayRawRequest,
  buildUrl,
  buildUrlFromTarget,
  getHeaderValue,
  getRequestTarget,
  getUrlConnectionInfo,
  normalizeClipboardUrl,
  parseAbsoluteUrl,
  parseHostHeader,
} from "./utils";

export type RequestContext = {
  type: "RequestContext";
  request: {
    host: string;
    isTls: boolean;
    path: string;
    port: number;
    query: string;
  };
};

type RequestRow = {
  host: string;
  isTls: boolean;
  path: string;
  port: number;
  query: string;
};

export type RequestRowContext = {
  type: "RequestRowContext";
  requests: RequestRow[];
};

export const isRequestContext = (
  context: { type: string },
): context is RequestContext => context.type === "RequestContext";

export const isRequestRowContext = (
  context: { type: string },
): context is RequestRowContext => context.type === "RequestRowContext";

const copyText = async (sdk: FrontendSDK, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    sdk.window.showToast("URL copied", { variant: "success" });
  } catch {
    sdk.window.showToast("Failed to copy URL", { variant: "error" });
  }
};

export const copyReplayUrlFromRequestContext = async (
  sdk: FrontendSDK,
  context: RequestContext,
) => {
  const url = buildUrl(context.request);
  await copyText(sdk, url);
};

export const copyReplayUrlFromRequestRowContext = async (
  sdk: FrontendSDK,
  context: RequestRowContext,
) => {
  if (context.requests.length !== 1) {
    sdk.window.showToast("Select exactly one request row", {
      variant: "warn",
    });
    return;
  }

  const url = buildUrl(context.requests[0]);
  await copyText(sdk, url);
};

export const copyReplayUrlFromEditor = async (
  sdk: FrontendSDK,
  rawRequest: string,
) => {
  const target = getRequestTarget(rawRequest);
  if (target === undefined) {
    sdk.window.showToast("Failed to parse the Replay request", {
      variant: "error",
    });
    return;
  }

  const absoluteUrl = parseAbsoluteUrl(target);
  if (absoluteUrl !== undefined) {
    await copyText(sdk, absoluteUrl);
    return;
  }

  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    sdk.window.showToast("No Replay session is currently selected", {
      variant: "warn",
    });
    return;
  }

  const entryId = currentSession.entryIds.at(-1);
  if (entryId === undefined) {
    sdk.window.showToast("The current Replay session has no request entry", {
      variant: "warn",
    });
    return;
  }

  const entry = sdk.replay.getEntry(entryId);
  const result = await sdk.backend.getRequestConnectionInfo(entry.requestId);
  if (result.kind === "Error") {
    sdk.window.showToast(result.error, { variant: "error" });
    return;
  }

  const hostHeader = getHeaderValue(rawRequest, "host");
  const hostFromHeader =
    hostHeader === undefined ? undefined : parseHostHeader(hostHeader);
  const url = buildUrlFromTarget({
    host: hostFromHeader?.host ?? result.value.host,
    isTls: result.value.isTls,
    port: hostFromHeader?.port ?? result.value.port,
    target,
  });

  await copyText(sdk, url);
};

export const pasteReplayUrlIntoReplay = async (sdk: FrontendSDK) => {
  let clipboardValue: string;

  try {
    clipboardValue = await navigator.clipboard.readText();
  } catch {
    sdk.window.showToast("Failed to read the clipboard", { variant: "error" });
    return;
  }

  const url = normalizeClipboardUrl(clipboardValue);
  if (url === undefined) {
    sdk.window.showToast("Clipboard does not contain a valid URL", {
      variant: "error",
    });
    return;
  }

  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    sdk.window.showToast("No Replay session is currently selected", {
      variant: "warn",
    });
    return;
  }

  try {
    await sdk.replay.sendRequest(currentSession.id, {
      connectionInfo: getUrlConnectionInfo(url),
      raw: buildReplayRawRequest(url),
      overwriteDraft: true,
      updateContentLength: false,
    });
    sdk.window.showToast("URL pasted into Replay and request sent", {
      variant: "success",
    });
  } catch {
    sdk.window.showToast("Failed to update the Replay target", {
      variant: "error",
    });
  }
};
