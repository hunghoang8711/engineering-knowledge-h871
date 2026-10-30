import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isProjectDocumentPath } from "./storage-path.ts";

const projectId = "123e4567-e89b-12d3-a456-426614174000";

Deno.test("accepts an uploaded PDF in its own project folder", () => {
  assertEquals(
    isProjectDocumentPath(
      `${projectId}/550e8400-e29b-41d4-a716-446655440000.pdf`,
      projectId,
    ),
    true,
  );
});

Deno.test("rejects another project's object", () => {
  assertEquals(
    isProjectDocumentPath(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/550e8400-e29b-41d4-a716-446655440000.pdf",
      projectId,
    ),
    false,
  );
});

Deno.test("rejects nested, traversal, absolute, and non-UUID keys", () => {
  for (const path of [
    `${projectId}/nested/550e8400-e29b-41d4-a716-446655440000.pdf`,
    `${projectId}/../other/file.pdf`,
    `/${projectId}/550e8400-e29b-41d4-a716-446655440000.pdf`,
    `${projectId}/document.pdf`,
  ]) {
    assertEquals(isProjectDocumentPath(path, projectId), false, path);
  }
});

Deno.test("rejects malformed project identifiers and empty paths", () => {
  assertEquals(isProjectDocumentPath("", projectId), false);
  assertEquals(isProjectDocumentPath("project/file.pdf", "project"), false);
});
