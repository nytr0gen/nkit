const chromeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.165 Safari/537.36";

export const buildUrl = ({
  host,
  isTls,
  path,
  port,
  query,
}: {
  host: string;
  isTls: boolean;
  path: string;
  port: number;
  query: string;
}) => {
  const protocol = isTls ? "https" : "http";
  const isDefaultPort =
    (isTls && port === 443) || (!isTls && port === 80);
  const origin = `${protocol}://${host}${isDefaultPort ? "" : `:${port}`}`;
  return `${origin}${path}${query === "" ? "" : `?${query}`}`;
};

export const getHeaderValue = (rawRequest: string, headerName: string) => {
  const lines = rawRequest.split(/\r?\n/);

  for (const line of lines.slice(1)) {
    if (line === "") {
      break;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    if (name !== headerName.toLowerCase()) {
      continue;
    }

    return line.slice(separatorIndex + 1).trim();
  }

  return undefined;
};

export const getRequestTarget = (rawRequest: string) => {
  const requestLine = rawRequest.split(/\r?\n/, 1)[0];
  const match = requestLine.match(/^\S+\s+(\S+)\s+HTTP\/\d+(?:\.\d+)?$/);
  return match?.[1];
};

export const parseAbsoluteUrl = (target: string) => {
  try {
    const url = new URL(target);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {}

  return undefined;
};

export const parseHostHeader = (hostHeader: string) => {
  if (hostHeader.startsWith("[")) {
    const endIndex = hostHeader.indexOf("]");
    if (endIndex === -1) {
      return { host: hostHeader };
    }

    const host = hostHeader.slice(0, endIndex + 1);
    const portValue = hostHeader.slice(endIndex + 2);
    const port = Number(portValue);
    return Number.isNaN(port) ? { host } : { host, port };
  }

  const separatorIndex = hostHeader.lastIndexOf(":");
  if (separatorIndex === -1) {
    return { host: hostHeader };
  }

  const portValue = hostHeader.slice(separatorIndex + 1);
  const port = Number(portValue);
  if (Number.isNaN(port)) {
    return { host: hostHeader };
  }

  return {
    host: hostHeader.slice(0, separatorIndex),
    port,
  };
};

export const buildUrlFromTarget = ({
  host,
  isTls,
  port,
  target,
}: {
  host: string;
  isTls: boolean;
  port: number;
  target: string;
}) => {
  const normalizedTarget = target.startsWith("/") ? target : `/${target}`;
  return buildUrl({
    host,
    isTls,
    path: normalizedTarget,
    port,
    query: "",
  });
};

export const normalizeClipboardUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return undefined;
  }

  const prefixedValue = /^https?:\/\//.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(prefixedValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url;
  } catch {
    return undefined;
  }
};

export const getUrlConnectionInfo = (url: URL) => ({
  host: url.hostname,
  isTLS: url.protocol === "https:",
  port:
    url.port === ""
      ? url.protocol === "https:"
        ? 443
        : 80
      : Number(url.port),
});

export const buildReplayRawRequest = (url: URL) => {
  const target = `${url.pathname === "" ? "/" : url.pathname}${url.search}`;
  const headers = [
    `GET ${target} HTTP/1.1`,
    `Host: ${url.host}`,
    'sec-ch-ua: "Google Chrome";v="146", "Chromium";v="146", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile: ?0",
    'sec-ch-ua-platform: "macOS"',
    `User-Agent: ${chromeUserAgent}`,
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-User: ?1",
    "Sec-Fetch-Dest: document",
    "Accept-Encoding: gzip, deflate, br, zstd",
    "Accept-Language: en-US,en;q=0.9",
    "",
    "",
  ];

  return headers.join("\r\n");
};
