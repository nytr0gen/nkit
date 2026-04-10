<script setup lang="ts">
import type { RequestFull } from "@caido/sdk-frontend";
import { EditorState, RangeSetBuilder, StateField, type Text } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  request: RequestFull;
}>();

const container = ref<HTMLElement>();

const requestLineDecoration = Decoration.line({
  attributes: { class: "cm-httpRequestLine" },
});
const headerLineDecoration = Decoration.line({
  attributes: { class: "cm-httpHeaderLine" },
});
const bodyLineDecoration = Decoration.line({
  attributes: { class: "cm-httpBodyLine" },
});
const methodDecoration = Decoration.mark({
  class: "cm-httpMethod",
});
const versionDecoration = Decoration.mark({
  class: "cm-httpVersion",
});
const headerNameDecoration = Decoration.mark({
  class: "cm-httpHeaderName",
});

const buildDecorations = (doc: Text): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  const lines = doc.toString().split("\n");

  let offset = 0;
  let inHeaders = true;

  for (const [lineIndex, line] of lines.entries()) {
    if (lineIndex === 0) {
      builder.add(offset, offset, requestLineDecoration);

      const methodMatch = line.match(/^[A-Z]+/);
      if (methodMatch !== null) {
        builder.add(offset, offset + methodMatch[0].length, methodDecoration);
      }

      const versionMatch = line.match(/HTTP\/\d(?:\.\d+)?$/);
      if (versionMatch !== null) {
        const versionStart = offset + line.length - versionMatch[0].length;
        builder.add(versionStart, versionStart + versionMatch[0].length, versionDecoration);
      }
    } else if (inHeaders) {
      if (line.length === 0) {
        inHeaders = false;
      } else {
        builder.add(offset, offset, headerLineDecoration);

        const headerNameMatch = line.match(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+(?=:)/);
        if (headerNameMatch !== null) {
          builder.add(
            offset,
            offset + headerNameMatch[0].length,
            headerNameDecoration,
          );
        }
      }
    } else if (line.length > 0) {
      builder.add(offset, offset, bodyLineDecoration);
    }

    offset += line.length + 1;
  }

  return builder.finish();
};

const highlightField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state.doc);
  },
  update(highlights, transaction) {
    if (!transaction.docChanged) {
      return highlights;
    }

    return buildDecorations(transaction.state.doc);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

const viewerTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--p-surface-800, #e5e7eb)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  ".cm-content": {
    padding: "0.75rem 1rem",
    caretColor: "transparent",
  },
  ".cm-line": {
    padding: 0,
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(96, 165, 250, 0.24)",
  },
  ".cm-httpRequestLine": {
    color: "var(--p-surface-900, #f8fafc)",
  },
  ".cm-httpHeaderLine": {
    color: "var(--p-surface-700, #cbd5e1)",
  },
  ".cm-httpBodyLine": {
    color: "var(--p-surface-600, #94a3b8)",
  },
  ".cm-httpMethod": {
    color: "var(--p-primary-400, #60a5fa)",
    fontWeight: "700",
  },
  ".cm-httpVersion": {
    color: "var(--p-surface-500, #94a3b8)",
  },
  ".cm-httpHeaderName": {
    color: "var(--p-cyan-400, #22d3ee)",
    fontWeight: "600",
  },
});

let editorView: EditorView | undefined;

const updateDocument = (rawRequest: string) => {
  if (editorView === undefined) {
    return;
  }

  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: rawRequest,
    },
  });
};

onMounted(() => {
  const parent = container.value;
  if (parent === undefined) {
    return;
  }

  editorView = new EditorView({
    state: EditorState.create({
      doc: props.request.raw,
      extensions: [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        highlightField,
        viewerTheme,
      ],
    }),
    parent,
  });
});

watch(
  () => props.request.raw,
  (rawRequest) => {
    updateDocument(rawRequest);
  },
);

onBeforeUnmount(() => {
  editorView?.destroy();
});
</script>

<template>
  <div ref="container" style="height: 100%" />
</template>
