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

import type { FrontendSDK } from "@/types";

type Result<T> =
  | { kind: "Error"; error: string; variant: "error" | "warning" }
  | { kind: "Ok"; value: T };

type RequestContext = {
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

type RequestRowContext = {
  type: "RequestRowContext";
  requests: RequestRow[];
};

export const isRequestContext = (context: {
  type: string;
}): context is RequestContext => context.type === "RequestContext";

export const isRequestRowContext = (context: {
  type: string;
}): context is RequestRowContext => context.type === "RequestRowContext";

const copyText = async (sdk: FrontendSDK, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    sdk.window.showToast("URL copied", { variant: "success" });
  } catch {
    sdk.window.showToast("Failed to copy URL", { variant: "error" });
  }
};

const waitForReplaySessionCreation = (
  sdk: FrontendSDK,
  sessionIdsBefore: Set<string>,
) => {
  // eslint-disable-next-line compat/compat
  return new Promise<string | undefined>((resolve) => {
    const listener = sdk.replay.onSessionCreate((event) => {
      if (sessionIdsBefore.has(event.session.id)) {
        return;
      }

      window.clearTimeout(timeoutId);
      listener.stop();
      resolve(event.session.id);
    });

    const timeoutId = window.setTimeout(() => {
      listener.stop();
      resolve(undefined);
    }, 1000);
  });
};

export const getReplayUrlFromRawRequest = async (
  sdk: FrontendSDK,
  rawRequest: string,
): Promise<Result<string>> => {
  const target = getRequestTarget(rawRequest);
  if (target === undefined) {
    return {
      kind: "Error",
      error: "Failed to parse the Replay request",
      variant: "error",
    };
  }

  const absoluteUrl = parseAbsoluteUrl(target);
  if (absoluteUrl !== undefined) {
    return {
      kind: "Ok",
      value: absoluteUrl.href,
    };
  }

  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    return {
      kind: "Error",
      error: "No Replay session is currently selected",
      variant: "warning",
    };
  }

  const entryId = currentSession.entryIds.at(-1);
  if (entryId === undefined) {
    return {
      kind: "Error",
      error: "The current Replay session has no request entry",
      variant: "warning",
    };
  }

  const entry = sdk.replay.getEntry(entryId);
  const hostHeader = getHeaderValue(rawRequest, "host");
  const hostFromHeader =
    hostHeader === undefined ? undefined : parseHostHeader(hostHeader);
  const entryConnection = entry.connection;
  if (entryConnection !== undefined) {
    return {
      kind: "Ok",
      value: buildUrlFromTarget({
        host: hostFromHeader?.host ?? entryConnection.host,
        isTls: entryConnection.isTLS,
        port: hostFromHeader?.port ?? entryConnection.port,
        target,
      }),
    };
  }

  const requestId = entry.request?.id ?? entry.requestId;
  if (requestId !== undefined) {
    const result = await sdk.backend.getRequestConnectionInfo(requestId);
    if (result.kind === "Error") {
      return {
        kind: "Error",
        error: result.error,
        variant: "error",
      };
    }

    return {
      kind: "Ok",
      value: buildUrlFromTarget({
        host: hostFromHeader?.host ?? result.value.host,
        isTls: result.value.isTls,
        port: hostFromHeader?.port ?? result.value.port,
        target,
      }),
    };
  }

  return {
    kind: "Ok",
    value: buildUrlFromTarget({
      host: hostFromHeader?.host ?? "",
      isTls: true,
      port: hostFromHeader?.port ?? 443,
      target,
    }),
  };
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
      variant: "warning",
    });
    return;
  }

  const [request] = context.requests;
  if (request === undefined) {
    sdk.window.showToast("Select exactly one request row", {
      variant: "warning",
    });
    return;
  }

  const url = buildUrl(request);
  await copyText(sdk, url);
};

export const copyReplayUrlFromEditor = async (
  sdk: FrontendSDK,
  rawRequest: string,
) => {
  const result = await getReplayUrlFromRawRequest(sdk, rawRequest);
  if (result.kind === "Error") {
    sdk.window.showToast(result.error, {
      variant: result.variant,
    });
    return;
  }

  await copyText(sdk, result.value);
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

  try {
    const currentSession = sdk.replay.getCurrentSession();
    const sessionIdsBefore = new Set(
      sdk.replay.getSessions().map((session) => session.id),
    );
    const nextSessionId = waitForReplaySessionCreation(sdk, sessionIdsBefore);

    await sdk.replay.createSession(
      {
        connectionInfo: getUrlConnectionInfo(url),
        raw: buildReplayRawRequest(url),
        type: "Raw",
      },
      currentSession?.collectionId,
    );

    const sessionId =
      sdk.replay
        .getSessions()
        .find((session) => !sessionIdsBefore.has(session.id))?.id ??
      (await nextSessionId);
    if (sessionId === undefined) {
      sdk.window.showToast("Failed to create a Replay session", {
        variant: "error",
      });
      return;
    }

    await sdk.replay.sendRequest(sessionId, {
      background: false,
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
