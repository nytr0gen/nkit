<script setup lang="ts">
import {
  EditorState,
  RangeSetBuilder,
  StateField,
  type Text,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  lineNumbers,
} from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  errorMessage?: string;
  rawRequest: string;
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
        builder.add(
          versionStart,
          versionStart + versionMatch[0].length,
          versionDecoration,
        );
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

// This viewer is intentionally tuned for Caido dark mode only.
const viewerTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "#d8dee9",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "#5e6b7d",
    paddingRight: "0.5rem",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 0.35rem 0 0.75rem",
  },
  ".cm-content": {
    padding: "0.75rem 1rem 0.75rem 0",
    caretColor: "transparent",
  },
  ".cm-line": {
    padding: 0,
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(94, 129, 172, 0.28)",
  },
  ".cm-httpRequestLine": {
    color: "#eceff4",
  },
  ".cm-httpHeaderLine": {
    color: "#c8d2e0",
  },
  ".cm-httpBodyLine": {
    color: "#aebac8",
  },
  ".cm-httpMethod": {
    color: "#88c0d0",
    fontWeight: "700",
  },
  ".cm-httpVersion": {
    color: "#7f8c9d",
  },
  ".cm-httpHeaderName": {
    color: "#b48ead",
    fontWeight: "600",
  },
});

let editorView: EditorView | undefined;

const destroyEditorView = () => {
  editorView?.destroy();
  editorView = undefined;
};

const createEditorView = () => {
  const parent = container.value;
  if (parent === undefined || props.errorMessage !== undefined) {
    return;
  }

  destroyEditorView();
  editorView = new EditorView({
    state: EditorState.create({
      doc: props.rawRequest,
      extensions: [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        lineNumbers(),
        highlightField,
        viewerTheme,
      ],
    }),
    parent,
  });
};

const updateDocument = () => {
  if (props.errorMessage !== undefined) {
    destroyEditorView();
    return;
  }

  if (editorView === undefined) {
    createEditorView();
    return;
  }

  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: props.rawRequest,
    },
  });
};

onMounted(() => {
  createEditorView();
});

watch(
  () => [props.errorMessage, props.rawRequest] as const,
  () => {
    updateDocument();
  },
);

onBeforeUnmount(() => {
  destroyEditorView();
});
</script>

<template>
  <div class="h-full relative">
    <div ref="container" style="height: 100%" />
    <div
      v-if="errorMessage !== undefined"
      class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-surface-400"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
