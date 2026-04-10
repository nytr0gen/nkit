<script setup lang="ts">
import RequestViewer from "@/requestViewer/RequestViewer.vue";

const props = defineProps<{
  request: {
    raw: string;
  };
}>();
</script>

<template>
  <RequestViewer :raw-request="props.request.raw" />
</template>
