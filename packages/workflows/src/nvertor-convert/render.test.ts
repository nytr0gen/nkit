import { renderNvertorTemplate } from "./render.ts";

const successCases = [
  ["<@b64>abc", "YWJj"],
  ["<@urld>a%20b", "a b"],
  ["<@repeat(2)>ab", "abab"],
  ["<@>unchanged", "unchanged"],
  ["<@url>x=<@b64>a b", "x%3DYSBi"],
  ["<@url>x=<@b64>a b</@>", "x%3DYSBi"],
  ["<@url>x=<@b64>a b</@></@>", "x%3DYSBi"],
  ["<@url>x=<@b64>a b</@b64></@url>", "x%3DYSBi"],
  ["<@url>a b</@>|<@b64>cd", "a%20b|Y2Q="],
  ["<@b64>xxx<@b64>yyy</@>zzz", "eHh4ZVhsNXp6eg=="],
  ["<@b64>xxx<@b64>yyy</@>zzz</@>", "eHh4ZVhsNXp6eg=="],
  ["<@b64>xxx<@b64>yyyzzz", "eHh4ZVhsNWVucDY="],
  ["<@b64>xxx</@><@b64>yyy", "eHh4eXl5"],
  ["<@b64>xxx\nyyy", "eHh4Cnl5eQ=="],
  ["<@b64>xxx\r\nyyy", "eHh4DQp5eXk="],
  ["before\n<@url>a b\nc d", "before\na%20b%0Ac%20d"],
  ["<@b64>xxx\n<@b64>yyy\n</@>\nzzz", "eHh4CmVYbDVDZz09Cnp6eg=="],
] as const;

for (const [input, expected] of successCases) {
  const result = renderNvertorTemplate(input);
  if (result.kind !== "Ok" || result.value !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(input)} to render as ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`,
    );
  }
}

const cappedRepeatValue = "x".repeat(100000);
for (const input of [
  "<@repeat(100000)>x",
  "<@repeat(100001)>x",
  "<@loop(999999999999999999999999)>x",
]) {
  const result = renderNvertorTemplate(input);
  if (result.kind !== "Ok" || result.value !== cappedRepeatValue) {
    throw new Error(`Expected ${input} to repeat at the 100000 limit`);
  }
}

const errorCases = [
  ["<@url>x<@b64>y</@url>", "Expected closing tag </@b64>"],
  ["</@>", "Unexpected closing tag </@>"],
  ["<@urld>%", "Invalid percent-encoded input"],
] as const;

for (const [input, expectedError] of errorCases) {
  const result = renderNvertorTemplate(input);
  if (result.kind !== "Error" || result.error !== expectedError) {
    throw new Error(
      `Expected ${JSON.stringify(input)} to fail with ${JSON.stringify(expectedError)}, got ${JSON.stringify(result)}`,
    );
  }
}
