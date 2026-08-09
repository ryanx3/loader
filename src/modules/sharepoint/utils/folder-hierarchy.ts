import client from "../../../shared/infra/providers/sharepoint/sharepoint-client";

export async function folderHierarchy(driveId: string, path: string) {
  const partes = path.split("/");
  let currentPath = "";

  for (const parte of partes) {
    currentPath += `/${parte}`;
    try {
      await client.api(`/drives/${driveId}/root:${currentPath}`).get();
    } catch {
      await client.api(`/drives/${driveId}/root:${currentPath}`).put({
        name: parte,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      });
    }
  }
}
