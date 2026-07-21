import type { Caido } from "@caido/sdk-frontend";
import type { HTTPQL } from "@caido/sdk-frontend/src/types/utils";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
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

type ReplayEntry = {
  connection?: ReplayConnectionInfo;
  id: ID;
  request?: {
    id: ID;
  };
  requestId?: ID;
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

type ReplayRequestSource =
  | {
      id: ID;
      type: "ID";
    }
  | {
      connectionInfo: ReplayConnectionInfo;
      raw: string;
      type: "Raw";
    };

type SendRequestOptions = {
  background?: boolean;
};

type GlobalContext = {
  page?: {
    kind: string;
  };
};

type MatchReplaceSource =
  | "AUTOMATE"
  | "INTERCEPT"
  | "PLUGIN"
  | "REPLAY"
  | "SAMPLE"
  | "WORKFLOW";

type MatchReplaceSection = unknown;

type MatchReplaceRule = {
  collectionId: ID;
  id: ID;
  isEnabled: boolean;
  name: string;
  query: HTTPQL;
  section: MatchReplaceSection;
  sources: MatchReplaceSource[];
};

type MatchReplaceSlotButton = {
  type: "Button";
  icon?: string;
  label?: string;
  onClick: () => void | Promise<void>;
};

type MatchReplaceSlotCommand = {
  commandId: string;
  icon?: string;
  type: "Command";
};

type MatchReplaceSlotCustom = {
  definition: Component;
  type: "Custom";
};

type MatchReplaceSlotContent =
  | MatchReplaceSlotButton
  | MatchReplaceSlotCommand
  | MatchReplaceSlotCustom;

type ActiveEditor = {
  getEditorView: () => EditorView;
};

export const MatchReplaceSlot = {
  CreateHeader: "create-header",
  UpdateHeader: "update-header",
} as const;

export type FrontendSDK = Omit<
  BaseFrontendSDK,
  | "findings"
  | "httpHistory"
  | "matchReplace"
  | "replay"
  | "search"
  | "sitemap"
  | "window"
> & {
  automate: {
    addRequestEditorExtension: (extension: Extension) => void;
  };
  findings: BaseFrontendSDK["findings"] & {
    addRequestEditorExtension: (extension: Extension) => void;
  };
  httpHistory: BaseFrontendSDK["httpHistory"] & {
    addRequestEditorExtension: (extension: Extension) => void;
    addRequestViewMode: (options: RequestViewModeOptions) => void;
  };
  matchReplace: Omit<
    BaseFrontendSDK["matchReplace"],
    | "createRule"
    | "getCurrentRule"
    | "getRules"
    | "onCurrentRuleChange"
    | "toggleRule"
  > & {
    addToSlot: (
      slot: (typeof MatchReplaceSlot)[keyof typeof MatchReplaceSlot],
      content: MatchReplaceSlotContent,
    ) => void;
    createRule: (options: {
      collectionId: ID;
      name: string;
      query: HTTPQL;
      section: MatchReplaceSection;
      sources: MatchReplaceSource[];
    }) => Promise<MatchReplaceRule>;
    getCurrentRule: () => MatchReplaceRule | undefined;
    getRules: () => MatchReplaceRule[];
    onCurrentRuleChange: (
      callback: (event: { ruleId: ID | undefined }) => void,
    ) => ListenerHandle;
    selectRule: (id: ID | undefined) => void;
    toggleRule: (id: ID, enabled: boolean) => Promise<void>;
  };
  replay: BaseFrontendSDK["replay"] & {
    addRequestEditorExtension: (extension: Extension) => void;
    addRequestViewMode: (options: RequestViewModeOptions) => void;
    createSession: (
      source: ReplayRequestSource,
      collectionId?: ID,
    ) => Promise<void>;
    getCurrentSession: () => ReplaySession | undefined;
    getEntry: (entryId: ID) => ReplayEntry;
    onCurrentSessionChange: (
      callback: (event: { sessionId: ID | undefined }) => void,
    ) => ListenerHandle;
    onSessionCreate: (
      callback: (event: { session: ReplaySession }) => void,
    ) => ListenerHandle;
    sendRequest: (sessionId: ID, options: SendRequestOptions) => Promise<void>;
  };
  search: BaseFrontendSDK["search"] & {
    addRequestEditorExtension: (extension: Extension) => void;
  };
  sitemap: BaseFrontendSDK["sitemap"] & {
    addRequestEditorExtension: (extension: Extension) => void;
  };
  window: BaseFrontendSDK["window"] & {
    getActiveEditor: () => ActiveEditor | undefined;
    getContext: () => GlobalContext;
    onContextChange: (
      callback: (context: GlobalContext) => void,
    ) => ListenerHandle;
  };
};

export type { MatchReplaceRule };
