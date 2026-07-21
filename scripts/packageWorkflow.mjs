import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateManifest } from "@caido/plugin-manifest";
import JSZip from "jszip";
import { build } from "vite";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const packageDirectory = path.join(repositoryRoot, "dist", "plugin_package");
const workflowId = "nvertor-convert";
const workflowSourceDirectory = path.join(
  repositoryRoot,
  "packages",
  "workflows",
  "src",
  workflowId,
);
const workflowBuildDirectory = path.join(
  repositoryRoot,
  "dist",
  ".nvertor-workflow-build",
);

const addDirectoryToZip = async (zip, directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const folder = zip.folder(entry.name);
      if (folder === null) {
        throw new Error(`Failed to package ${entryPath}`);
      }
      await addDirectoryToZip(folder, entryPath);
    } else {
      zip.file(entry.name, await fs.readFile(entryPath));
    }
  }
};

await fs.rm(workflowBuildDirectory, { force: true, recursive: true });

try {
  await build({
    build: {
      emptyOutDir: true,
      lib: {
        entry: path.join(workflowSourceDirectory, "javascript.ts"),
        fileName: () => "javascript.js",
        formats: ["es"],
      },
      minify: false,
      outDir: workflowBuildDirectory,
      target: "es2020",
    },
    configFile: false,
    logLevel: "warn",
  });

  const definition = JSON.parse(
    await fs.readFile(path.join(workflowSourceDirectory, "definition.json"), "utf8"),
  );
  const javascriptNode = definition.graph.nodes.find(
    (node) => node.definition_id === "caido/code-js",
  );
  const codeInput = javascriptNode?.inputs.find((input) => input.alias === "code");
  if (codeInput === undefined) {
    throw new Error("The nvertor workflow is missing its Javascript code input");
  }

  codeInput.value = {
    data: await fs.readFile(
      path.join(workflowBuildDirectory, "javascript.js"),
      "utf8",
    ),
    kind: "string",
  };

  const packagedWorkflowDirectory = path.join(packageDirectory, workflowId);
  await fs.mkdir(packagedWorkflowDirectory, { recursive: true });
  await fs.writeFile(
    path.join(packagedWorkflowDirectory, "definition.json"),
    `${JSON.stringify(definition, null, 2)}\n`,
  );

  const manifestPath = path.join(packageDirectory, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.plugins = manifest.plugins.filter((plugin) => plugin.id !== workflowId);
  manifest.plugins.push({
    definition: `${workflowId}/definition.json`,
    id: workflowId,
    kind: "workflow",
    name: "nvertor Convert",
  });

  if (!validateManifest(manifest)) {
    throw new Error("The plugin manifest is invalid after adding the workflow");
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const zip = new JSZip();
  await addDirectoryToZip(zip, packageDirectory);
  await fs.writeFile(
    path.join(repositoryRoot, "dist", "plugin_package.zip"),
    await zip.generateAsync({
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
      type: "nodebuffer",
    }),
  );
} finally {
  await fs.rm(workflowBuildDirectory, { force: true, recursive: true });
}
