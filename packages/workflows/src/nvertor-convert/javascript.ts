import type { BytesInput, SDK } from "caido:workflow";

import { formatRenderError, renderNvertorTemplate } from "./render";

export function run(input: BytesInput, sdk: SDK) {
  try {
    const original = sdk.asString(input);
    if (!original.includes("<@")) {
      return input;
    }

    const result = renderNvertorTemplate(original);
    if (result.kind === "Error") {
      sdk.console.warn(`nvertor: ${formatRenderError(result)}`);
      return input;
    }

    return result.value;
  } catch (error) {
    sdk.console.warn(
      `nvertor: conversion failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return input;
  }
}
