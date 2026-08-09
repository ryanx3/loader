import ExcelJS from "exceljs";
import { sanitizeForSharePoint } from "./sanitize-for-sharepoint";
import path from "path";
import fs from "fs/promises";

import { sendRecordingsToSharepoint } from "./send-file";
import {
  DownloadRecordingsRequest,
  RecordingWithFolderInfo,
} from "../../../migrating/use-cases/recordings/upload-recordings";

export async function generateAndSendExcelReport(
  recordings: RecordingWithFolderInfo[],
  data: DownloadRecordingsRequest,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chamadas Enviadas");

  worksheet.columns = [
    { header: "EASYCODE", key: "easycode", width: 20 },
    { header: "RESULTADO", key: "resultado", width: 15 },
    { header: "TIMESTAMP", key: "timestamp", width: 25 },
    { header: "LOCALIZAÇÃO", key: "location", width: 80 },
    { header: "STATUS", key: "status", width: 15 },
    { header: "OBSERVAÇÃO", key: "observation", width: 30 },
  ];

  // Estilizar cabeçalhos
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };

  // Adicionar dados
  for (const recording of recordings) {
    const startDateObj = new Date(recording.record.moment ?? new Date());
    const timestamp = startDateObj.toLocaleString("pt-BR");

    const row = worksheet.addRow({
      easycode: recording.record.easycode?.toString() || "N/A",
      resultado: recording.record.resultado || "N/A",
      timestamp,
      location: recording.sharepointLocation,
      status: recording.status === "SUCCESS" ? "Enviado" : "Erro",
      observation: recording.errorMessage || "Enviado com sucesso",
    });

    // Colorir linhas com erro
    if (recording.status === "ERROR") {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC7CE" },
      };
      row.font = { color: { argb: "9C0006" } };
    }
  }

  // Adicionar totais
  const totalRecords = recordings.length;
  const successRecords = recordings.filter(
    (r) => r.status === "SUCCESS",
  ).length;
  const errorRecords = recordings.filter((r) => r.status === "ERROR").length;

  worksheet.addRow([]);

  const totalRow = worksheet.addRow(["TOTAL DE REGISTROS:", totalRecords]);
  totalRow.font = { bold: true };

  worksheet.addRow(["ENVIADOS COM SUCESSO:", successRecords]);

  const errorRow = worksheet.addRow(["COM ERRO:", errorRecords]);

  if (errorRecords > 0) {
    errorRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2CC" },
    };
    errorRow.font = { bold: true, color: { argb: "BF8F00" } };
  }

  const safeCampaignName = data.ctName.replace(/[^a-zA-Z0-9]/g, "_");

  const excelBuffer = await workbook.xlsx.writeBuffer();

  const startDateObj = new Date();
  const ano = startDateObj.getFullYear();
  const mes = String(startDateObj.getMonth() + 1).padStart(2, "0");
  const dia = String(startDateObj.getDate()).padStart(2, "0");

  const excelFileName = `Relatorio_Chamadas_${safeCampaignName}_${startDateObj}.xlsx`;

  const campanha = sanitizeForSharePoint(data.ctName);
  const folderParts = [data.folderPath, campanha];

  if (data.isBd) {
    folderParts.push(ano.toString(), mes, dia);
  }

  const reportFolderPath = folderParts.join("/");

  try {
    await sendRecordingsToSharepoint({
      driveId: data.driveId,
      folderPath: reportFolderPath,
      fileName: excelFileName,
      buffer: Buffer.from(excelBuffer),
    });

    const localFilePath = path.join(process.cwd(), "reports", excelFileName);
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await workbook.xlsx.writeFile(localFilePath);
  } catch (error) {
    console.error("❌ Erro ao enviar relatório para SharePoint:", error);
    const localFilePath = path.join(process.cwd(), "reports", excelFileName);
    await fs.mkdir(path.dirname(localFilePath), { recursive: true });
    await workbook.xlsx.writeFile(localFilePath);
  }
}
