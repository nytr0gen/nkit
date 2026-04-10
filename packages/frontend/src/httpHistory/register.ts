import type { FrontendSDK } from "@/types";
import FinalRequestView from "./FinalRequestView.vue";

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

// TODO work in progress
// export const registerHttpHistoryFeature = (sdk: FrontendSDK) => {
//   ensureHttpHistoryStyle(window.document);
//   sdk.httpHistory.addRequestViewMode({
//     label: "Final",
//     view: {
//       component: FinalRequestView,
//     },
//   });
// };
