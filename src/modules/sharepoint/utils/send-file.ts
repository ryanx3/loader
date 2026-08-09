import client from "../../../shared/infra/providers/sharepoint/sharepoint-client";
import { folderHierarchy } from "./folder-hierarchy";

type SendRecordingsToSharepointProps = {
  driveId: string;
  folderPath: string;
  fileName: string;
  buffer: Buffer;
};

export async function sendRecordingsToSharepoint({
  driveId,
  folderPath,
  fileName,
  buffer,
}: SendRecordingsToSharepointProps) {
  await folderHierarchy(driveId, folderPath);
  await client
    .api(`/drives/${driveId}/root:/${folderPath}/${fileName}:/content`)
    .put(buffer);
}
