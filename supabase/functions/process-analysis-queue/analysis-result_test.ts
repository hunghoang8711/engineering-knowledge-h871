import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clean, parseModelJson, strings } from "./analysis-result.ts";

Deno.test("clean trims strings and applies maximum length", () => {
  assertEquals(clean("  engineering  "), "engineering");
  assertEquals(clean("abcdef", 3), "abc");
  assertEquals(clean(42), "");
});

Deno.test("strings filters non-strings, trims, and bounds output", () => {
  assertEquals(strings([" A ", 3, "", "B", "C"], 2), ["A", "B"]);
  assertEquals(strings("not-an-array"), []);
  assertEquals(strings(["x".repeat(510)])[0].length, 500);
});

Deno.test("parseModelJson accepts plain JSON and fenced JSON", () => {
  assertEquals(parseModelJson('{"summary":"ok"}').summary, "ok");
  assertEquals(parseModelJson('```json\n{"summary":"ok"}\n```').summary, "ok");
});

Deno.test("parseModelJson rejects arrays, null, and invalid JSON", () => {
  assertThrows(() => parseModelJson("[]"), Error, "MODEL_OUTPUT_INVALID");
  assertThrows(() => parseModelJson("null"), Error, "MODEL_OUTPUT_INVALID");
  assertThrows(() => parseModelJson("{bad json"), SyntaxError);
});
