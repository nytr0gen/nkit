import { ViewPlugin, type ViewUpdate } from "@codemirror/view";

import {
  canCopyConvertedRequest,
  copyConvertedRequest,
  sendConvertedRequest,
} from "./actions";
import ConvertedRequestView from "./ConvertedRequestView.vue";
import { setReplayCurrentSessionId, setReplayDraftRaw } from "./store";

import { type FrontendSDK, ReplaySlot } from "@/caido";

const copyConvertedRequestCommandId = "nkit.copy-converted-request";
const sendConvertedRequestCommandId = "nkit.send-converted-request";

const syncReplayDraftFromActiveEditor = (sdk: FrontendSDK) => {
  const currentSession = sdk.replay.getCurrentSession();
  setReplayCurrentSessionId(currentSession?.id);

  if (currentSession === undefined) {
    return;
  }

  if (sdk.window.getContext().page?.kind !== "Replay") {
    return;
  }

  const activeEditor = sdk.window.getActiveEditor();
  if (activeEditor === undefined) {
    return;
  }

  setReplayDraftRaw(
    currentSession.id,
    activeEditor.getEditorView().state.doc.toString(),
  );
};

const buildReplayDraftTracker = (sdk: FrontendSDK) => {
  return ViewPlugin.fromClass(
    class {
      constructor() {
        syncReplayDraftFromActiveEditor(sdk);
      }

      update(update: ViewUpdate) {
        const currentSession = sdk.replay.getCurrentSession();
        if (currentSession === undefined) {
          return;
        }

        setReplayCurrentSessionId(currentSession.id);
        setReplayDraftRaw(currentSession.id, update.state.doc.toString());
      }
    },
  );
};

export const registerNvertorFeature = (sdk: FrontendSDK) => {
  syncReplayDraftFromActiveEditor(sdk);

  sdk.replay.onCurrentSessionChange((event) => {
    setReplayCurrentSessionId(event.sessionId);
    syncReplayDraftFromActiveEditor(sdk);
  });
  sdk.window.onContextChange(() => {
    syncReplayDraftFromActiveEditor(sdk);
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

  sdk.commands.register(sendConvertedRequestCommandId, {
    group: "nvertor",
    name: "Send Converted Request",
    run: async () => {
      await sendConvertedRequest(sdk);
    },
    when: () => {
      return sdk.window.getContext().page?.kind === "Replay";
    },
  });
  sdk.shortcuts.register(sendConvertedRequestCommandId, ["Control", "Enter"]);
  sdk.shortcuts.register(sendConvertedRequestCommandId, ["Meta", "Enter"]);

  sdk.menu.registerItem({
    commandId: copyConvertedRequestCommandId,
    leadingIcon: "fas fa-copy",
    type: "Request",
  });

  sdk.replay.addToSlot(ReplaySlot.SessionToolbarSecondary, {
    commandId: sendConvertedRequestCommandId,
    icon: "fas fa-wand-magic-sparkles",
    kind: "Command",
  });

  sdk.replay.addRequestViewMode({
    label: "Converted",
    view: {
      component: ConvertedRequestView,
    },
  });

  sdk.replay.addRequestEditorExtension(buildReplayDraftTracker(sdk));
};
