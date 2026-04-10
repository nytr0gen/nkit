<script setup lang="ts">
import { computed, watch } from "vue";

import { formatRenderError, renderNvertorTemplate } from "./render";
import {
  currentReplaySessionId,
  getReplayDraftRaw,
  setReplayDraftRaw,
} from "./store";

import RequestViewer from "@/requestViewer/RequestViewer.vue";

const props = defineProps<{
  request: {
    raw: string;
  };
}>();

watch(
  () => [currentReplaySessionId.value, props.request.raw] as const,
  ([sessionId, rawRequest]) => {
    if (sessionId === undefined || getReplayDraftRaw(sessionId) !== undefined) {
      return;
    }

    setReplayDraftRaw(sessionId, rawRequest);
  },
  {
    immediate: true,
  },
);

const currentRawRequest = computed(() => {
  const sessionId = currentReplaySessionId.value;
  if (sessionId === undefined) {
    return props.request.raw;
  }

  return getReplayDraftRaw(sessionId) ?? props.request.raw;
});

const renderResult = computed(() => {
  return renderNvertorTemplate(currentRawRequest.value);
});

const convertedRawRequest = computed(() => {
  return renderResult.value.kind === "Ok" ? renderResult.value.value : "";
});

const errorMessage = computed(() => {
  return renderResult.value.kind === "Error"
    ? formatRenderError(renderResult.value)
    : undefined;
});
</script>

<template>
  <RequestViewer
    :error-message="errorMessage"
    :raw-request="convertedRawRequest"
  />
</template>
