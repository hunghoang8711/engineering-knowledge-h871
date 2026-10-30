// Pure result-normalization helpers shared by the queue worker and Deno tests.
export const clean = (value: unknown, max = 12000): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export const strings = (value: unknown, max = 40): string[] =>
  Array.isArray(value)
    ? value
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().slice(0, 500))
      .filter(Boolean)
      .slice(0, max)
    : [];

export function parseModelJson(text: string): Record<string, unknown> {
  const value = JSON.parse(
    text.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, ""),
  );
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("MODEL_OUTPUT_INVALID");
  }
  return value as Record<string, unknown>;
}
