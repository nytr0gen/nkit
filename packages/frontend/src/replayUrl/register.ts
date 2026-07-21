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
const styleId = "nkit-replay-style";
const replayCss = `[data-session-id] > [data-pc-name="buttongroup"] > button:first-child > div:first-of-type {
  display: none;
}`;

const ensureReplayStyle = (document: Document) => {
  if (document.getElementById(styleId) !== null) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = replayCss;
  document.head.appendChild(style);
};

export const registerReplayUrlFeature = (sdk: FrontendSDK) => {
  ensureReplayStyle(window.document);

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

  const copyUrlKeymap = keymap.of([
    {
      key: "Mod-Shift-c",
      preventDefault: true,
      run: (view) => {
        void copyReplayUrlFromEditor(sdk, view.state.doc.toString());
        return true;
      },
    },
  ]);

  sdk.automate.addRequestEditorExtension(copyUrlKeymap);
  sdk.findings.addRequestEditorExtension(copyUrlKeymap);
  sdk.httpHistory.addRequestEditorExtension(copyUrlKeymap);
  sdk.search.addRequestEditorExtension(copyUrlKeymap);
  sdk.sitemap.addRequestEditorExtension(copyUrlKeymap);
  sdk.replay.addRequestEditorExtension([
    copyUrlKeymap,
    keymap.of([
      {
        key: "Mod-Shift-v",
        preventDefault: true,
        run: () => {
          void pasteReplayUrlIntoReplay(sdk);
          return true;
        },
      },
    ]),
  ]);
};
