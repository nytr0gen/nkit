import type { FrontendSDK } from "@/types";

const toggleRequestAlterationCommandId =
  "nkit.http-history-toggle-request-alteration";
const styleId = "nkit-http-history-style";
const httpHistoryCss = `[data-pc-name="splitterpanel"] [data-pc-section="content"] .text-nowrap.truncate.max-w-96 {
  max-width: initial;
}`;

const ensureHttpHistoryStyle = (document: Document) => {
  if (document.getElementById(styleId) !== null) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = httpHistoryCss;
  document.head.appendChild(style);
};

const requestAlterationComboboxSelector =
  '[role="combobox"][aria-label="Request alteration"]';
const requestAlterationOptionSelector =
  '[role="option"], [data-pc-section="item"]';
const codeMirrorContentSelector = ".cm-content";

const nextFrame = () =>
  // eslint-disable-next-line compat/compat
  new Promise<void>((resolve) => {
    // eslint-disable-next-line compat/compat
    requestAnimationFrame(() => {
      resolve();
    });
  });

const isVisible = (element: Element | undefined): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
};

const getVisibleRequestAlterationCombobox = (
  root: ParentNode,
): HTMLElement | undefined => {
  const comboboxes = Array.from(
    root.querySelectorAll(requestAlterationComboboxSelector),
  ).filter(isVisible);

  if (comboboxes.length !== 1) {
    return undefined;
  }

  return comboboxes[0];
};

const getComboboxLabel = (combobox: HTMLElement) =>
  combobox.textContent?.trim() ?? "";

const getVisibleListbox = (combobox: HTMLElement): HTMLElement | undefined => {
  const controlsId = combobox.getAttribute("aria-controls");
  if (controlsId !== null) {
    const ownedListbox =
      window.document.getElementById(controlsId) ?? undefined;
    if (isVisible(ownedListbox)) {
      return ownedListbox;
    }
  }

  const listboxes = Array.from(
    window.document.querySelectorAll('[role="listbox"]'),
  ).filter(isVisible);

  if (listboxes.length !== 1) {
    return undefined;
  }

  return listboxes[0];
};

const getVisibleOptions = (listbox: HTMLElement) =>
  Array.from(listbox.querySelectorAll(requestAlterationOptionSelector)).filter(
    isVisible,
  );

const getEditorFocusTarget = (
  sdk: FrontendSDK,
  combobox: HTMLElement,
): HTMLElement | undefined => {
  const activeEditor = sdk.window.getActiveEditor()?.getEditorView();
  if (activeEditor !== undefined) {
    return activeEditor.contentDOM;
  }

  const contentScope = combobox.closest('[data-pc-section="content"]');
  if (contentScope !== null) {
    const scopedEditor = Array.from(
      contentScope.querySelectorAll(codeMirrorContentSelector),
    ).find(isVisible);
    if (scopedEditor !== undefined) {
      return scopedEditor;
    }
  }

  const splitterScope = combobox.closest('[data-pc-name="splitterpanel"]');
  if (splitterScope !== null) {
    const scopedEditor = Array.from(
      splitterScope.querySelectorAll(codeMirrorContentSelector),
    ).find(isVisible);
    if (scopedEditor !== undefined) {
      return scopedEditor;
    }
  }

  return Array.from(
    window.document.querySelectorAll(codeMirrorContentSelector),
  ).find(isVisible);
};

const refocusEditor = async (focusTarget: HTMLElement | undefined) => {
  if (focusTarget === undefined) {
    return;
  }

  await nextFrame();
  focusTarget.focus();
  await nextFrame();
  focusTarget.focus();
};

const cycleRequestAlteration = async (sdk: FrontendSDK) => {
  const combobox = getVisibleRequestAlterationCombobox(window.document);
  if (combobox === undefined) {
    return;
  }

  const focusTarget = getEditorFocusTarget(sdk, combobox);
  const currentLabel = getComboboxLabel(combobox);
  if (currentLabel.length === 0) {
    return;
  }

  combobox.click();

  let options: HTMLElement[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await nextFrame();

    const listbox = getVisibleListbox(combobox);
    if (listbox === undefined) {
      continue;
    }

    options = getVisibleOptions(listbox);
    if (options.length > 0) {
      break;
    }
  }

  if (options.length < 2) {
    await refocusEditor(focusTarget);
    return;
  }

  const currentIndex = options.findIndex((option) => {
    return option.textContent?.trim() === currentLabel;
  });

  if (currentIndex === -1) {
    await refocusEditor(focusTarget);
    return;
  }

  const nextIndex = (currentIndex + 1) % options.length;
  const nextOption = options[nextIndex];
  if (nextOption === undefined) {
    await refocusEditor(focusTarget);
    return;
  }

  nextOption.click();
  await refocusEditor(focusTarget);
};

export const registerHttpHistoryFeature = (sdk: FrontendSDK) => {
  ensureHttpHistoryStyle(window.document);
  sdk.commands.register(toggleRequestAlterationCommandId, {
    group: "nkit",
    name: "Toggle HTTP History Request Alteration",
    run: () => {
      void cycleRequestAlteration(sdk);
    },
    when: () => {
      return sdk.window.getContext().page?.kind === "HTTPHistory";
    },
  });
  sdk.shortcuts.register(toggleRequestAlterationCommandId, [
    "Control",
    "Shift",
    "E",
  ]);
  sdk.shortcuts.register(toggleRequestAlterationCommandId, [
    "Meta",
    "Shift",
    "E",
  ]);
};
