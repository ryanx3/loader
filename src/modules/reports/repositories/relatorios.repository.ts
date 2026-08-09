export interface CreateReportParams {
  clientName: string;
  siteId: string;
  driveId: string;
  folderPath: string;
  foldersByDate: boolean;
  machine: string;
  schedule: string;
  status: "ACTIVO" | "INACTIVO";
}

export interface UpdateReportStatusParams {
  id: number;
  lastStatus: "SUCCESS" | "ERROR" | "PENDING";
  error?: string;
  fileSize?: number;
}

export interface Report {
  id: number;
  client_name: string;
  site_id: string;
  drive_id: string;
  folder_path: string;
  status: "ACTIVO" | "INACTIVO";
  last_send: Date | null;
  last_status: "SUCCESS" | "ERROR" | "PENDING" | null;
  error: string | null;
  folders_by_date: boolean;
  file_size: number | null;
  calls_today: number;
  last_count_date: Date | null;
  machine: string | null;
  schedule: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReportsRepository {
  create: (data: CreateReportParams) => Promise<void>;
  findAllActive: () => Promise<Report[]>;
  findByName: (clientName: string) => Promise<Report | null>;
  deactivateClient: (clientName: string) => Promise<void>;
  updateStatus: (data: UpdateReportStatusParams) => Promise<void>;
}
