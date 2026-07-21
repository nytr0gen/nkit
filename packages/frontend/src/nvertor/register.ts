import { ViewPlugin, type ViewUpdate } from "@codemirror/view";

import {
  canCopyConvertedRequest,
  copyConvertedRequest,
  copyConvertedUrl,
} from "./actions";
import ConvertedRequestView from "./ConvertedRequestView.vue";
import { setReplayCurrentSessionId, setReplayDraftRaw } from "./store";

import type { FrontendSDK } from "@/caido";

const copyConvertedRequestCommandId = "nkit.copy-converted-request";
const copyConvertedUrlCommandId = "nkit.copy-converted-url";

const buildReplayDraftTracker = (sdk: FrontendSDK) => {
  return ViewPlugin.fromClass(
    class {
      constructor(editorView: ViewUpdate["view"]) {
        this.sync(editorView.state.doc.toString());
      }

      update(update: ViewUpdate) {
        this.sync(update.state.doc.toString());
      }

      private sync(rawRequest: string) {
        const currentSession = sdk.replay.getCurrentSession();
        if (currentSession === undefined) {
          return;
        }

        setReplayCurrentSessionId(currentSession.id);
        setReplayDraftRaw(currentSession.id, rawRequest);
      }
    },
  );
};

export const registerNvertorFeature = (sdk: FrontendSDK) => {
  sdk.replay.onCurrentSessionChange((event) => {
    setReplayCurrentSessionId(event.sessionId);
  });

  sdk.commands.register(copyConvertedRequestCommandId, {
    group: "nvertor",
    name: "Copy Converted Request",
    run: async (context) => {
      if (context.type !== "RequestContext") {
        return;
      }

      await copyConvertedRequest(sdk, context.request.raw);
    },
    when: (context) => {
      return canCopyConvertedRequest(sdk, context);
    },
  });

  sdk.commands.register(copyConvertedUrlCommandId, {
    group: "nvertor",
    name: "Copy Converted URL",
    run: async (context) => {
      if (context.type !== "RequestContext") {
        return;
      }

      await copyConvertedUrl(sdk, context.request.raw);
    },
    when: (context) => {
      return canCopyConvertedRequest(sdk, context);
    },
  });

  sdk.menu.registerItem({
    commandId: copyConvertedRequestCommandId,
    leadingIcon: "fas fa-copy",
    type: "Request",
  });
  sdk.menu.registerItem({
    commandId: copyConvertedUrlCommandId,
    leadingIcon: "fas fa-link",
    type: "Request",
  });

  sdk.replay.addRequestViewMode({
    label: "Converted",
    view: {
      component: ConvertedRequestView,
    },
  });

  sdk.replay.addRequestEditorExtension(buildReplayDraftTracker(sdk));
};
