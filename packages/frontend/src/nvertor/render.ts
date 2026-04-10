type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

type TextNode = {
  kind: "Text";
  value: string;
};

type TransformNode = {
  argument?: number;
  children: Node[];
  kind: "Transform";
  name: TransformName;
  offset: number;
};

type Node = TextNode | TransformNode;

type TransformDefinition =
  | {
      apply: (input: string, argument?: number) => Result<string>;
      kind: "transform";
    }
  | {
      apply: () => string;
      kind: "generator";
    };

export type TransformName =
  | "b64"
  | "b64d"
  | "html"
  | "htmld"
  | "repeat"
  | "ts"
  | "url"
  | "urlall"
  | "urlalld"
  | "urld"
  | "uuid";

export type RenderError = {
  error: string;
  kind: "Error";
  offset: number;
  tagName?: TransformName;
};

export type RenderResult =
  | RenderError
  | {
      kind: "Ok";
      value: string;
    };

type ParseResult =
  | RenderError
  | {
      kind: "Ok";
      nextOffset: number;
      value: Node[];
    };

const encoder = new TextEncoder();
const maxRepeatCount = 10000;

const binaryFromUtf8 = (value: string) => {
  const bytes = encoder.encode(value);
  return String.fromCodePoint(...bytes);
};

const encodeAllUrlBytes = (value: string) => {
  return Array.from(encoder.encode(value), (byte) => {
    return `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }).join("");
};

const utf8FromBinary = (value: string) => {
  const bytes = Uint8Array.from(value, (character) => {
    return character.codePointAt(0) ?? 0;
  });

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
};

const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });

const invalid = (error: string): Result<never> => ({
  kind: "Error",
  error,
});

const encodeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const namedHtmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  quot: '"',
};

const decodeNumericEntity = (entity: string, radix: 10 | 16) => {
  const codePoint = Number.parseInt(entity, radix);
  if (!Number.isFinite(codePoint) || !Number.isSafeInteger(codePoint)) {
    return undefined;
  }

  if (!Number.isInteger(codePoint)) {
    return undefined;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return undefined;
  }
};

const decodeHtml = (value: string) => {
  return value.replaceAll(
    /&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]+));/g,
    (entity, decimalEntity, hexEntity, namedEntity) => {
      if (typeof decimalEntity === "string") {
        return decodeNumericEntity(decimalEntity, 10) ?? entity;
      }

      if (typeof hexEntity === "string") {
        return decodeNumericEntity(hexEntity, 16) ?? entity;
      }

      if (typeof namedEntity === "string") {
        return namedHtmlEntities[namedEntity] ?? entity;
      }

      return entity;
    },
  );
};

const transformRegistry = {
  b64: {
    kind: "transform",
    apply: (value) => {
      return ok(btoa(binaryFromUtf8(value)));
    },
  },
  b64d: {
    kind: "transform",
    apply: (value) => {
      try {
        return ok(utf8FromBinary(atob(value)));
      } catch {
        return invalid("Invalid Base64 input");
      }
    },
  },
  html: {
    kind: "transform",
    apply: (value) => {
      return ok(encodeHtml(value));
    },
  },
  htmld: {
    kind: "transform",
    apply: (value) => {
      return ok(decodeHtml(value));
    },
  },
  repeat: {
    kind: "transform",
    apply: (value, argument) => {
      if (argument === undefined) {
        return invalid("Missing repeat count");
      }

      return ok(value.repeat(argument));
    },
  },
  ts: {
    kind: "generator",
    apply: () => {
      return `${Math.floor(Date.now() / 1000)}`;
    },
  },
  url: {
    kind: "transform",
    apply: (value) => {
      return ok(encodeURIComponent(value).replaceAll("'", "%27"));
    },
  },
  urlall: {
    kind: "transform",
    apply: (value) => {
      return ok(encodeAllUrlBytes(value));
    },
  },
  urlalld: {
    kind: "transform",
    apply: (value) => {
      try {
        return ok(decodeURIComponent(value));
      } catch {
        return invalid("Invalid percent-encoded input");
      }
    },
  },
  urld: {
    kind: "transform",
    apply: (value) => {
      try {
        return ok(decodeURIComponent(value));
      } catch {
        return invalid("Invalid percent-encoded input");
      }
    },
  },
  uuid: {
    kind: "generator",
    apply: () => {
      return crypto.randomUUID();
    },
  },
} satisfies Record<TransformName, TransformDefinition>;

const isTransformName = (value: string): value is TransformName => {
  return value in transformRegistry;
};

const formatTag = (tagName: TransformName) => {
  return `<@${tagName}>`;
};

const wildcardCloseTag = "</@>";

const parseOpenTag = (input: string, offset: number) => {
  const match = input
    .slice(offset)
    .match(/^<@([a-z][a-z0-9]*)(?:\(([^)]*)\))?(\s*\/)?>/);
  if (match === null) {
    return invalid("Invalid transform tag syntax");
  }

  const tagName = match[1];
  if (tagName === undefined) {
    return invalid("Invalid transform tag syntax");
  }

  if (!isTransformName(tagName)) {
    return invalid(`Unknown transform ${tagName}`);
  }

  const argument = match[2];
  if (tagName === "repeat") {
    if (argument === undefined) {
      return invalid("Missing repeat count");
    }

    if (!/^\d+$/.test(argument)) {
      return invalid("Invalid repeat count");
    }

    const repeatCount = Number.parseInt(argument, 10);
    if (repeatCount > maxRepeatCount) {
      return invalid(`Repeat count cannot exceed ${maxRepeatCount}`);
    }

    const fullMatch = match[0];
    if (fullMatch === undefined) {
      return invalid("Invalid transform tag syntax");
    }

    return ok({
      argument: repeatCount,
      nextOffset: offset + fullMatch.length,
      selfClosing: match[3] !== undefined,
      tagName,
    });
  }

  if (argument !== undefined) {
    return invalid(`${formatTag(tagName)} does not accept arguments`);
  }

  const fullMatch = match[0];
  if (fullMatch === undefined) {
    return invalid("Invalid transform tag syntax");
  }

  return ok({
    argument: undefined,
    nextOffset: offset + fullMatch.length,
    selfClosing: match[3] !== undefined,
    tagName,
  });
};

const parseCloseTag = (input: string, offset: number) => {
  if (input.startsWith(wildcardCloseTag, offset)) {
    return ok({
      nextOffset: offset + wildcardCloseTag.length,
      tagName: undefined,
    });
  }

  const match = input.slice(offset).match(/^<\/@([a-z][a-z0-9]*)\s*>/);
  if (match === null) {
    return invalid("Invalid closing transform tag syntax");
  }

  const tagName = match[1];
  if (tagName === undefined) {
    return invalid("Invalid closing transform tag syntax");
  }

  if (!isTransformName(tagName)) {
    return invalid(`Unknown transform ${tagName}`);
  }

  const fullMatch = match[0];
  if (fullMatch === undefined) {
    return invalid("Invalid closing transform tag syntax");
  }

  return ok({
    nextOffset: offset + fullMatch.length,
    tagName,
  });
};

const pushTextNode = (nodes: Node[], value: string) => {
  if (value === "") {
    return;
  }

  const lastNode = nodes.at(-1);
  if (lastNode?.kind === "Text") {
    lastNode.value += value;
    return;
  }

  nodes.push({
    kind: "Text",
    value,
  });
};

const parseNodes = (
  input: string,
  expectedTagName?: TransformName,
  openingOffset?: number,
  startOffset = 0,
): ParseResult => {
  const nodes: Node[] = [];
  let cursor = startOffset;
  let textStart = startOffset;

  while (cursor < input.length) {
    if (input[cursor] !== "<") {
      cursor += 1;
      continue;
    }

    if (input.startsWith("</@", cursor)) {
      pushTextNode(nodes, input.slice(textStart, cursor));

      const closeTag = parseCloseTag(input, cursor);
      if (closeTag.kind === "Error") {
        return {
          ...closeTag,
          offset: cursor,
        };
      }

      if (expectedTagName === undefined) {
        return {
          error:
            closeTag.value.tagName === undefined
              ? `Unexpected closing tag ${wildcardCloseTag}`
              : `Unexpected closing tag ${formatTag(closeTag.value.tagName)}`,
          kind: "Error",
          offset: cursor,
          tagName: closeTag.value.tagName,
        };
      }

      if (
        closeTag.value.tagName !== undefined &&
        closeTag.value.tagName !== expectedTagName
      ) {
        return {
          error: `Expected closing tag </@${expectedTagName}>`,
          kind: "Error",
          offset: cursor,
          tagName: closeTag.value.tagName,
        };
      }

      return {
        kind: "Ok",
        nextOffset: closeTag.value.nextOffset,
        value: nodes,
      };
    }

    if (input.startsWith("<@", cursor)) {
      pushTextNode(nodes, input.slice(textStart, cursor));

      const openTag = parseOpenTag(input, cursor);
      if (openTag.kind === "Error") {
        return {
          ...openTag,
          offset: cursor,
        };
      }

      const definition = transformRegistry[openTag.value.tagName];
      if (definition.kind === "generator") {
        nodes.push({
          argument: openTag.value.argument,
          children: [],
          kind: "Transform",
          name: openTag.value.tagName,
          offset: cursor,
        });
        cursor = openTag.value.nextOffset;
        textStart = cursor;
        continue;
      }

      if (openTag.value.selfClosing) {
        return {
          error: `${formatTag(openTag.value.tagName)} cannot be self-closing`,
          kind: "Error",
          offset: cursor,
          tagName: openTag.value.tagName,
        };
      }

      const childResult = parseNodes(
        input,
        openTag.value.tagName,
        cursor,
        openTag.value.nextOffset,
      );
      if (childResult.kind === "Error") {
        return childResult;
      }

      nodes.push({
        argument: openTag.value.argument,
        children: childResult.value,
        kind: "Transform",
        name: openTag.value.tagName,
        offset: cursor,
      });
      cursor = childResult.nextOffset;
      textStart = cursor;
      continue;
    }

    cursor += 1;
  }

  pushTextNode(nodes, input.slice(textStart));

  if (expectedTagName !== undefined) {
    return {
      error: `Unclosed tag ${formatTag(expectedTagName)}`,
      kind: "Error",
      offset: openingOffset ?? 0,
      tagName: expectedTagName,
    };
  }

  return {
    kind: "Ok",
    nextOffset: cursor,
    value: nodes,
  };
};

const renderNodes = (nodes: Node[]): RenderResult => {
  let output = "";

  for (const node of nodes) {
    if (node.kind === "Text") {
      output += node.value;
      continue;
    }

    const definition = transformRegistry[node.name];
    if (definition.kind === "generator") {
      output += definition.apply();
      continue;
    }

    const childResult = renderNodes(node.children);
    if (childResult.kind === "Error") {
      return childResult;
    }

    const transformResult = definition.apply(childResult.value, node.argument);
    if (transformResult.kind === "Error") {
      return {
        error: transformResult.error,
        kind: "Error",
        offset: node.offset,
        tagName: node.name,
      };
    }

    output += transformResult.value;
  }

  return {
    kind: "Ok",
    value: output,
  };
};

export const formatRenderError = (error: RenderError) => {
  if (error.tagName === undefined) {
    return `${error.error} at offset ${error.offset}`;
  }

  return `${error.error} in ${formatTag(error.tagName)} at offset ${error.offset}`;
};

export const renderNvertorTemplate = (rawRequest: string): RenderResult => {
  const parseResult = parseNodes(rawRequest);
  if (parseResult.kind === "Error") {
    return parseResult;
  }

  return renderNodes(parseResult.value);
};
