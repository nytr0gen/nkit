import { keymap } from "@codemirror/view";

import {
  copyReplayUrlFromEditor,
  copyReplayUrlFromRequestContext,
  copyReplayUrlFromRequestRowContext,
  isRequestContext,
  isRequestRowContext,
  pasteReplayUrlIntoReplay,
} from "./actions";

import type { FrontendSDK } from "@/types";

const copyReplayUrlCommandId = "nkit.copy-replay-url";
const pasteReplayUrlCommandId = "nkit.paste-replay-url";

export const registerReplayUrlFeature = (sdk: FrontendSDK) => {
  sdk.commands.register(copyReplayUrlCommandId, {
    name: "Copy URL",
    group: "nkit",
    run: async (context) => {
      if (isRequestContext(context)) {
        await copyReplayUrlFromRequestContext(sdk, context);
        return;
      }

      if (!isRequestRowContext(context)) {
        return;
      }

      await copyReplayUrlFromRequestRowContext(sdk, context);
    },
  });

  sdk.commands.register(pasteReplayUrlCommandId, {
    name: "Paste Replay URL",
    group: "nkit",
    run: async (context) => {
      if (!isRequestContext(context)) {
        return;
      }

      await pasteReplayUrlIntoReplay(sdk);
    },
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: copyReplayUrlCommandId,
    leadingIcon: "fas fa-link",
  });
  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: copyReplayUrlCommandId,
    leadingIcon: "fas fa-link",
  });
  sdk.menu.registerItem({
    type: "Request",
    commandId: pasteReplayUrlCommandId,
    leadingIcon: "fas fa-paste",
  });

  sdk.replay.addRequestEditorExtension(
    keymap.of([
      {
        key: "Mod-Shift-c",
        preventDefault: true,
        run: (view) => {
          void copyReplayUrlFromEditor(sdk, view.state.doc.toString());
          return true;
        },
      },
      {
        key: "Mod-Shift-v",
        preventDefault: true,
        run: () => {
          void pasteReplayUrlIntoReplay(sdk);
          return true;
        },
      },
    ]),
  );
  sdk.httpHistory.addRequestEditorExtension(
    keymap.of([
      {
        key: "Mod-Shift-c",
        preventDefault: true,
        run: (view) => {
          void copyReplayUrlFromEditor(sdk, view.state.doc.toString());
          return true;
        },
      },
    ]),
  );
  sdk.automate.addRequestEditorExtension(
    keymap.of([
      {
        key: "Mod-Shift-c",
        preventDefault: true,
        run: (view) => {
          void copyReplayUrlFromEditor(sdk, view.state.doc.toString());
          return true;
        },
      },
    ]),
  );
};
