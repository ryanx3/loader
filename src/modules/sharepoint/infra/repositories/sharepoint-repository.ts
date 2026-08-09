import client from "../../../../shared/infra/providers/sharepoint/sharepoint-client";
import { Drive } from "../../domain/entities/drive";
import { Folder } from "../../domain/entities/folder";
import { Site } from "../../domain/entities/site";
import { ISharepointRepository } from "../../domain/repositories/sharepoint-repository";
import { ResponseType } from "@microsoft/microsoft-graph-client";

export class SharepointRepository implements ISharepointRepository {
  async getSites(): Promise<Site[]> {
    const res = await client.api("/sites?search=*").get();
    return res.value
      .filter((s: any) => s.displayName.toLowerCase().startsWith("cliente"))
      .map((s: any) => ({ id: s.id, displayName: s.displayName }));
  }

  async getDrives(siteId: string): Promise<Drive[]> {
    const res = await client.api(`/sites/${siteId}/drives`).get();
    return res.value.map((d: any) => ({ id: d.id, name: d.name }));
  }

  async getFolders(driveId: string, folderPath = ""): Promise<Folder[]> {
    const apiPath = folderPath
      ? `/drives/${driveId}/root:/${folderPath}:/children`
      : `/drives/${driveId}/root/children`;

    const res = await client.api(apiPath).get();
    return res.value
      .filter((item: any) => item.folder)
      .map((folder: any) => ({
        name: folder.name,
        path: folderPath ? `${folderPath}/${folder.name}` : folder.name,
        hasChildren: folder.folder.childCount > 0,
      }));
  }

  async downloadFile(driveId: string, filePath: string): Promise<Buffer> {
    const response = await client
      .api(`/drives/${driveId}/root:/${filePath}:/content`)
      .responseType(ResponseType.ARRAYBUFFER)
      .get();
    return Buffer.from(response);
  }

  async uploadFile({
    driveId,
    filePath,
    fileBuffer,
  }: {
    driveId: string;
    filePath: string;
    fileBuffer: Buffer;
  }): Promise<void> {
    const fileSize = fileBuffer.length;
    const chunkSize = 5 * 1024 * 1024; // 5 MB — deve ser múltiplo de 320 KB

    const session = await client
      .api(`/drives/${driveId}/root:/${filePath}:/createUploadSession`)
      .post({
        item: {
          "@microsoft.graph.conflictBehavior": "replace",
        },
      });

    const uploadUrl: string = session.uploadUrl;
    let offset = 0;

    while (offset < fileSize) {
      const end = Math.min(offset + chunkSize, fileSize);
      const chunk = fileBuffer.slice(offset, end);

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": `${chunk.length}`,
          "Content-Range": `bytes ${offset}-${end - 1}/${fileSize}`,
          "Content-Type": "application/octet-stream",
        },
        body: chunk,
      });

      if (!response.ok && response.status !== 202) {
        const errorBody = await response.text();
        throw new Error(
          `Chunk upload failed at offset ${offset}: ${response.status} ${errorBody}`,
        );
      }

      offset = end;
    }
  }
}
