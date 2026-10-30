// Validate the exact object-key layout used by frontend uploadFiles().
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isProjectDocumentPath(path: string, projectId: string): boolean {
  if (!path || path.length > 1000 || path.startsWith("/") || path.includes("..")) return false;
  if (!new RegExp(`^${UUID}$`, "i").test(projectId)) return false;
  const objectKey = path.slice(projectId.length + 1);
  if (!path.startsWith(`${projectId}/`) || objectKey.includes("/")) return false;
  return new RegExp(`^${UUID}\\.[a-z0-9]{1,10}$`, "i").test(objectKey);
}
