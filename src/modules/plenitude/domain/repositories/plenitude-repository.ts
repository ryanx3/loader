export interface SendRecordingsToClientApiRequest {
  initialDate: string;
  endDate: string;
  percentOfResults: number;
}

export interface RecordingSendLog {
  recording_key: string;
  easycode: number;
  telefone: string;
  contrato: string;
  contrato_n: string;
  resultado: string;
  ftps_source_path: string;
  sftp_destination_path: string;
  file_name: string;
  status: "SUCCESS" | "ERROR";
  error_type?: "SYSTEM";
  error_message?: string;
}

export interface RecordingData {
  rec_key: string;
  time_stamp: string;
  rec_time: string;
  file_size: number;
}

export interface RecordingRow {
  easycode: number;
  contrato: string;
  tipo_resultado: string;
  contrato_n: string;
  contrato_n_gas: string;
  tel_marcado: string;
  telefone: string;
  logincontacto: string;
  duracao: number;
  recording_key: string;
  moment: Date;
  global_recording_key: string;
  global_interaction: string;
  interaction_id: string;
  call_start: Date;
  termination_state: string;
  resultado: string;
  contact_profile: string;
  media_type: string;
  origin: string;
}

export interface IPlenitudeRepository {
  getRecordingsByDay(
    data: SendRecordingsToClientApiRequest,
  ): Promise<RecordingRow[]>;
  saveSendRecordingLog: (data: RecordingSendLog) => Promise<void>;
  findByRecKeys: (recKeys: string[]) => Promise<RecordingData[]>;
}
