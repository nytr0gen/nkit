const chromeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.165 Safari/537.36";

type ParsedHttpUrl = {
  host: string;
  hostname: string;
  href: string;
  pathname: string;
  port: string;
  protocol: "http:" | "https:";
  search: string;
};

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
  const isDefaultPort = (isTls && port === 443) || (!isTls && port === 80);
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
  if (requestLine === undefined) {
    return undefined;
  }

  const match = requestLine.match(/^\S+\s+(\S+)\s+HTTP\/\d+(?:\.\d+)?$/);
  return match?.[1];
};

const parseHttpUrl = (value: string) => {
  try {
    // eslint-disable-next-line compat/compat
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return undefined;
    }

    if (url.hostname === "") {
      return undefined;
    }

    return {
      host: url.host,
      hostname: url.hostname,
      href: url.href,
      pathname: url.pathname,
      port: url.port,
      protocol,
      search: url.search,
    } satisfies ParsedHttpUrl;
  } catch {
    return undefined;
  }
};

export const parseAbsoluteUrl = (target: string) => {
  if (!/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(target)) {
    return undefined;
  }

  return parseHttpUrl(target);
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

  return parseHttpUrl(prefixedValue);
};

export const getUrlConnectionInfo = (url: ParsedHttpUrl) => ({
  host: url.hostname,
  isTLS: url.protocol === "https:",
  port:
    url.port === "" ? (url.protocol === "https:" ? 443 : 80) : Number(url.port),
});

export const buildReplayRawRequest = (url: ParsedHttpUrl) => {
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
