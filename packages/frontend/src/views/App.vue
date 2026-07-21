<script setup lang="ts">
import Card from "primevue/card";

const tagReference = `Transforms
<@url>text</@>             URL encode
<@urld>text</@>            URL decode
<@urlall>text</@>          Percent-encode every UTF-8 byte
<@urlalld>text</@>         Decode percent-encoded text
<@b64>text</@>             Base64 encode UTF-8 text
<@b64d>text</@>            Base64 decode UTF-8 text
<@html>text</@>            HTML entity encode
<@htmld>text</@>           HTML entity decode
<@repeat(3)>text</@>       Repeat text three times
<@loop(3)>text</@>         Alias for repeat

Generators
<@uuid>  or <@uuid/>       Generate a UUID
<@ts>    or <@ts/>         Generate a Unix timestamp

Closing tags
</@>                       Close the current transform
</@url>                    Close a specifically named transform

Transforms can be nested. repeat and loop accept integers from 0 to 10000.`;
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card class="max-w-4xl mx-auto">
      <template #title>nvertor Replay setup</template>
      <template #subtitle>
        The nvertor Convert workflow is installed with this plugin.
      </template>
      <template #content>
        <ol class="m-0 pl-5 flex flex-col gap-2 text-sm">
          <li>Create a Match and Replace rule.</li>
          <li>Set Section to <code>Request Raw</code>.</li>
          <li>Set Matcher to <code>Full</code>.</li>
          <li>
            Set Replacer to <code>Workflow</code> and select
            <code>nvertor Convert</code>.
          </li>
          <li>Enable the <code>Replay</code> source.</li>
        </ol>

        <p class="mt-4 mb-0 text-sm text-surface-400">
          Caido's normal Replay send action will keep the tagged template in the
          editor and send the Match and Replace result. Invalid tags and
          conversion errors leave the original request unchanged.
        </p>

        <h2 class="mt-6 mb-2 text-base font-semibold">nvertor tags</h2>
        <pre
          class="m-0 overflow-x-auto rounded bg-surface-950 p-3 text-xs leading-relaxed text-surface-200"
        ><code>{{ tagReference }}</code></pre>

        <h2 class="mt-6 mb-2 text-base font-semibold">Shortcuts</h2>
        <ul class="m-0 pl-5 flex flex-col gap-2 text-sm">
          <li>
            <code>Ctrl/Cmd+Shift+C</code>: Copy URL from Replay, HTTP History,
            and Automate request editors.
          </li>
          <li><code>Ctrl/Cmd+Shift+V</code>: Paste a URL into Replay.</li>
          <li>
            <code>Ctrl/Cmd+Shift+E</code>: Cycle the HTTP History request
            alteration mode.
          </li>
        </ul>

        <h2 class="mt-6 mb-2 text-base font-semibold">Other tools</h2>
        <ul class="m-0 pl-5 flex flex-col gap-2 text-sm">
          <li>Copy URLs from Replay, HTTP History, and Automate requests.</li>
          <li>Copy the URL of one selected HTTP History row.</li>
          <li>
            Paste a URL into Replay to create and send a fresh GET request;
            missing protocols default to <code>https://</code>.
          </li>
          <li>
            Preview the current template in Replay's <code>Converted</code>
            request pane without changing the editor.
          </li>
          <li>
            Copy a converted request or URL from the Replay request context
            menu.
          </li>
          <li>
            Duplicate the current Match and Replace rule with the
            <code>Duplicate Rule</code> button.
          </li>
        </ul>
      </template>
    </Card>
  </div>
</template>
