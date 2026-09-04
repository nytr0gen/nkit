import { formatRenderError, renderNvertorTemplate } from "./render";

import type { FrontendSDK } from "@/caido";
import { getReplayUrlFromRawRequest } from "@/replayUrl/actions";

const normalizeHttpLineEndings = (rawRequest: string) => {
  // Replay history expects raw HTTP framing, so convert editor-normalized `\n`
  // back to `\r\n` before copy/send.
  return rawRequest.replaceAll(/\r?\n/g, "\r\n");
};

const normalizeBodylessRequestTerminator = (rawRequest: string) => {
  const headerTerminator = "\r\n\r\n";
  const headerEnd = rawRequest.indexOf(headerTerminator);

  // The first empty line ends the header section. Anything other than extra
  // CRLFs after it is request content, which this normalization leaves alone.
  const hasBody =
    headerEnd !== -1 &&
    !/^(?:\r\n)*$/u.test(rawRequest.slice(headerEnd + headerTerminator.length));
  if (hasBody) {
    return rawRequest;
  }

  // Replace zero or more trailing CRLFs with the single empty line required
  // between an HTTP/1.1 header section and an empty body.
  return rawRequest.replace(/(?:\r\n)*$/u, headerTerminator);
};

const copyText = async (
  sdk: FrontendSDK,
  text: string,
  messages: {
    failure: string;
    success: string;
  },
) => {
  try {
    await navigator.clipboard.writeText(text);
    sdk.window.showToast(messages.success, {
      variant: "success",
    });
  } catch {
    sdk.window.showToast(messages.failure, {
      variant: "error",
    });
  }
};

const isReplayPage = (sdk: FrontendSDK) => {
  return sdk.window.getContext().page?.kind === "Replay";
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

export const canRunReplayRequestAction = (
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

  await copyText(sdk, convertedRequest, {
    failure: "Failed to copy the converted request",
    success: "Converted request copied",
  });
};

export const copyConvertedUrl = async (
  sdk: FrontendSDK,
  rawRequest: string,
) => {
  const convertedRequest = renderReplayRequest(sdk, rawRequest);
  if (convertedRequest === undefined) {
    return;
  }

  const result = await getReplayUrlFromRawRequest(sdk, convertedRequest);
  if (result.kind === "Error") {
    sdk.window.showToast(result.error, {
      variant: result.variant,
    });
    return;
  }

  await copyText(sdk, result.value, {
    failure: "Failed to copy the converted URL",
    success: "Converted URL copied",
  });
};

export const normalizeReplayRequest = (
  sdk: FrontendSDK,
  rawRequest: string,
) => {
  const editor = sdk.window.getActiveEditor();
  if (editor === undefined || editor.isReadOnly()) {
    sdk.window.showToast("No editable Replay request is active", {
      variant: "warning",
    });
    return;
  }

  const editorView = editor.getEditorView();
  editorView.dispatch({
    selection: {
      anchor: 0,
      head: editorView.state.doc.length,
    },
  });
  const normalizedRequest = normalizeBodylessRequestTerminator(
    normalizeHttpLineEndings(rawRequest.trimStart()).replace(
      " HTTP/2\r\n",
      " HTTP/1.1\r\n",
    ),
  );
  editor.replaceSelectedText(normalizedRequest);
  editor.focus();
  sdk.window.showToast("Line endings normalized to CRLF", {
    variant: "success",
  });
};
