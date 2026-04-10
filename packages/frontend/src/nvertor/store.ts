import { ref } from "vue";

const replayDraftBySessionId = ref<Record<string, string>>({});

export const currentReplaySessionId = ref<string>();

export const getReplayDraftRaw = (sessionId: string) => {
  return replayDraftBySessionId.value[sessionId];
};

export const setReplayCurrentSessionId = (sessionId: string | undefined) => {
  currentReplaySessionId.value = sessionId;
};

export const setReplayDraftRaw = (sessionId: string, rawRequest: string) => {
  if (replayDraftBySessionId.value[sessionId] === rawRequest) {
    return;
  }

  replayDraftBySessionId.value = {
    ...replayDraftBySessionId.value,
    [sessionId]: rawRequest,
  };
};
