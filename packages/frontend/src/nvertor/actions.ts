import { formatRenderError, renderNvertorTemplate } from "./render";
import { getReplayDraftRaw } from "./store";

import type { FrontendSDK, ReplayConnectionInfo } from "@/caido";
import {
  getHeaderValue,
  getRequestTarget,
  getUrlConnectionInfo,
  parseAbsoluteUrl,
  parseHostHeader,
} from "@/replayUrl/utils";

type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

const normalizeHttpLineEndings = (rawRequest: string) => {
  // Replay history expects raw HTTP framing, so convert editor-normalized `\n`
  // back to `\r\n` before copy/send.
  return rawRequest.replaceAll(/\r?\n/g, "\r\n");
};

const copyText = async (sdk: FrontendSDK, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    sdk.window.showToast("Converted request copied", {
      variant: "success",
    });
  } catch {
    sdk.window.showToast("Failed to copy the converted request", {
      variant: "error",
    });
  }
};

const isReplayPage = (sdk: FrontendSDK) => {
  return sdk.window.getContext().page?.kind === "Replay";
};

const getCurrentReplayRawRequest = (sdk: FrontendSDK) => {
  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    return undefined;
  }

  const trackedRawRequest = getReplayDraftRaw(currentSession.id);
  if (trackedRawRequest !== undefined) {
    return trackedRawRequest;
  }

  if (!isReplayPage(sdk)) {
    return undefined;
  }

  return sdk.window.getActiveEditor()?.getEditorView().state.doc.toString();
};

const getReplayConnectionInfo = async (
  sdk: FrontendSDK,
  rawRequest: string,
): Promise<Result<ReplayConnectionInfo>> => {
  const requestTarget = getRequestTarget(rawRequest);
  if (requestTarget === undefined) {
    return {
      kind: "Error",
      error: "Failed to parse the request line",
    };
  }

  const absoluteUrl = parseAbsoluteUrl(requestTarget);
  if (absoluteUrl !== undefined) {
    return {
      kind: "Ok",
      value: getUrlConnectionInfo(absoluteUrl),
    };
  }

  const hostHeader = getHeaderValue(rawRequest, "host");
  if (hostHeader === undefined) {
    return {
      kind: "Error",
      error: "The request is missing a Host header",
    };
  }

  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    return {
      kind: "Error",
      error: "No Replay session is currently selected",
    };
  }

  const entryId = currentSession.entryIds.at(-1);
  if (entryId === undefined) {
    return {
      kind: "Error",
      error:
        "The current Replay session has no request entry to infer protocol from",
    };
  }

  const entry = sdk.replay.getEntry(entryId);
  const backendResult = await sdk.backend.getRequestConnectionInfo(
    entry.requestId,
  );
  if (backendResult.kind === "Error") {
    return backendResult;
  }

  const host = parseHostHeader(hostHeader);
  return {
    kind: "Ok",
    value: {
      host: host.host,
      isTLS: backendResult.value.isTls,
      port: host.port ?? backendResult.value.port,
    },
  };
};

const renderReplayRequest = (sdk: FrontendSDK, rawRequest: string) => {
  const renderResult = renderNvertorTemplate(rawRequest);
  if (renderResult.kind === "Error") {
    sdk.window.showToast(formatRenderError(renderResult), {
      variant: "error",
    });
    return undefined;
  }

  return normalizeHttpLineEndings(renderResult.value);
};

export const canCopyConvertedRequest = (
  sdk: FrontendSDK,
  context: { type: string },
) => {
  return context.type === "RequestContext" && isReplayPage(sdk);
};

export const copyConvertedRequest = async (
  sdk: FrontendSDK,
  rawRequest: string,
) => {
  const convertedRequest = renderReplayRequest(sdk, rawRequest);
  if (convertedRequest === undefined) {
    return;
  }

  await copyText(sdk, convertedRequest);
};

export const sendConvertedRequest = async (
  sdk: FrontendSDK,
  rawRequest = getCurrentReplayRawRequest(sdk),
) => {
  if (rawRequest === undefined) {
    sdk.window.showToast("No Replay request is currently available", {
      variant: "warning",
    });
    return;
  }

  const currentSession = sdk.replay.getCurrentSession();
  if (currentSession === undefined) {
    sdk.window.showToast("No Replay session is currently selected", {
      variant: "warning",
    });
    return;
  }

  const convertedRequest = renderReplayRequest(sdk, rawRequest);
  if (convertedRequest === undefined) {
    return;
  }

  const connectionInfo = await getReplayConnectionInfo(sdk, convertedRequest);
  if (connectionInfo.kind === "Error") {
    sdk.window.showToast(connectionInfo.error, {
      variant: "error",
    });
    return;
  }

  try {
    await sdk.replay.sendRequest(currentSession.id, {
      connectionInfo: connectionInfo.value,
      overwriteDraft: false,
      raw: convertedRequest,
      updateContentLength: true,
    });
    sdk.window.showToast("Converted request sent", {
      variant: "success",
    });
  } catch {
    sdk.window.showToast("Failed to send the converted request", {
      variant: "error",
    });
  }
};
