import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { registerHttpHistoryFeature } from "./httpHistory";
import { registerNvertorFeature } from "./nvertor";
import { SDKPlugin } from "./plugins/sdk";
import { registerReplayUrlFeature } from "./replayUrl";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  root.id = `plugin--nkit`;

  app.mount(root);

  sdk.navigation.addPage("/nkit", {
    body: root,
  });

  sdk.sidebar.registerItem("nkit", "/nkit");
  registerHttpHistoryFeature(sdk);
  registerNvertorFeature(sdk);
  registerReplayUrlFeature(sdk);
};
