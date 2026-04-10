import type { Caido } from "@caido/sdk-frontend";
import type { Extension } from "@codemirror/state";
import type { API } from "backend";
import type { Component } from "vue";

type BaseFrontendSDK = Caido<API, Record<string, never>>;
type ID = string;

type ListenerHandle = {
  stop: () => void;
};

type RequestLike = {
  raw: string;
};

type ComponentDefinition = {
  component: Component;
};

type RequestViewModeOptions = {
  label: string;
  view: ComponentDefinition;
  when?: (request: RequestLike) => boolean;
};

type ReplaySlotButton = {
  kind: "Button";
  label?: string;
  icon?: string;
  onClick: () => void;
};

type ReplaySlotCommand = {
  kind: "Command";
  commandId: string;
  icon?: string;
};

type ReplaySlotCustom = {
  kind: "Custom";
  component: ComponentDefinition;
};

type ReplaySlotContent =
  | ReplaySlotButton
  | ReplaySlotCommand
  | ReplaySlotCustom;

type ReplayEntry = {
  id: ID;
  requestId: ID;
  sessionId: ID;
};

type ReplaySession = {
  collectionId: ID;
  entryIds: ID[];
  id: ID;
  name: string;
};

type ReplayConnectionInfo = {
  SNI?: string;
  host: string;
  isTLS: boolean;
  port: number;
};

type SendRequestOptions = {
  background?: boolean;
  connectionClose?: boolean;
  connectionInfo: ReplayConnectionInfo;
  overwriteDraft?: boolean;
  raw: string;
  updateContentLength?: boolean;
};

type GlobalContext = {
  page?: {
    kind: string;
  };
};

export const ReplaySlot = {
  SessionToolbarPrimary: "session-toolbar-primary",
  SessionToolbarSecondary: "session-toolbar-secondary",
  Topbar: "topbar",
} as const;

export type FrontendSDK = Omit<
  BaseFrontendSDK,
  "httpHistory" | "replay" | "window"
> & {
  automate: {
    addRequestEditorExtension: (extension: Extension) => void;
  };
  httpHistory: BaseFrontendSDK["httpHistory"] & {
    addRequestEditorExtension: (extension: Extension) => void;
    addRequestViewMode: (options: RequestViewModeOptions) => void;
  };
  replay: BaseFrontendSDK["replay"] & {
    addRequestEditorExtension: (extension: Extension) => void;
    addRequestViewMode: (options: RequestViewModeOptions) => void;
    addToSlot: (
      slot: (typeof ReplaySlot)[keyof typeof ReplaySlot],
      content: ReplaySlotContent,
    ) => void;
    getCurrentSession: () => ReplaySession | undefined;
    getEntry: (entryId: ID) => ReplayEntry;
    onCurrentSessionChange: (
      callback: (event: { sessionId: ID | undefined }) => void,
    ) => ListenerHandle;
    sendRequest: (sessionId: ID, options: SendRequestOptions) => Promise<void>;
  };
  window: BaseFrontendSDK["window"] & {
    getContext: () => GlobalContext;
    onContextChange: (
      callback: (context: GlobalContext) => void,
    ) => ListenerHandle;
  };
};

export type { GlobalContext, ReplayConnectionInfo, ReplayEntry, ReplaySession };
