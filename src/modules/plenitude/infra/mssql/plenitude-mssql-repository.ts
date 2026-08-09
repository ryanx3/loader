import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";
import {
  IPlenitudeRepository,
  RecordingData,
  RecordingRow,
  RecordingSendLog,
  SendRecordingsToClientApiRequest,
} from "../../domain/repositories/plenitude-repository";

export class PlenitudeMssqlRepository implements IPlenitudeRepository {
  async getRecordingsByDay(data: SendRecordingsToClientApiRequest) {
    const conn = await connectPluricallDb("panther");
    const result = await conn.request().query(`
        BEGIN
    SET NOCOUNT ON;
    DECLARE @dataini  DATETIME = '${data.initialDate} 00:00:00';
    DECLARE @datafim  DATETIME = '${data.endDate} 23:59:59';
    DECLARE @percent_resultado INT = ${data.percentOfResults};
    IF OBJECT_ID('tempdb..#BASEPLENITUDE') IS NOT NULL
        DROP TABLE #BASEPLENITUDE;
    SELECT
        CT.easycode,
        CT.contrato,
        CT.tel_marcado,
        CT.tipo_resultado,
        CT.contrato_n,
        CT.contrato_n_gas,
        CASE
            WHEN CT.contrato = 'Contrato de eletricidade'
                THEN CT.contrato_n
            WHEN CT.contrato = 'Contrato de gás'
                THEN CT.contrato_n_gas
            WHEN CT.contrato = 'Contrato DUAL'
                THEN CT.contrato_n
        END AS variavel1,
        CASE
            WHEN CT.contrato = 'Contrato DUAL'
                THEN CT.contrato_n_gas
            ELSE NULL
        END AS variavel2,
        CT.logincontacto,
        CT.duracao,
        CT.resultado,
        CT.datacontacto,
        itr_record.recording_key,
        itr_record.start_time AS recording_moment
    INTO #BASEPLENITUDE
    FROM itr_recording itr_record WITH (NOLOCK)
    INNER JOIN ct_plenitude_all CT WITH (NOLOCK)
        ON itr_record.contact = CT.easycode
    WHERE itr_record.start_time >= @dataini
      AND itr_record.start_time < @datafim
      AND CT.duracao > 60;
    ;WITH RESULTADOS_3 AS (
        SELECT
            easycode,
            contrato,
            tel_marcado,
            tipo_resultado,
            contrato_n,
            contrato_n_gas,
            logincontacto,
            duracao,
            resultado,
            datacontacto,
            recording_key,
            recording_moment,
            ROW_NUMBER() OVER (ORDER BY NEWID()) AS rn,
            COUNT(*) OVER () AS total_rows
        FROM #BASEPLENITUDE
        WHERE resultado = '3'
    ),
    RESULTADOS AS (
        SELECT
            easycode,
            contrato,
            tel_marcado,
            tipo_resultado,
            contrato_n,
            contrato_n_gas,
            logincontacto,
            duracao,
            resultado,
            datacontacto,
            recording_key,
            recording_moment
        FROM #BASEPLENITUDE
        WHERE resultado = '1'
        UNION ALL
        SELECT
            easycode,
            contrato,
            tel_marcado,
            tipo_resultado,
            contrato_n,
            contrato_n_gas,
            logincontacto,
            duracao,
            resultado,
            datacontacto,
            recording_key,
            recording_moment
        FROM RESULTADOS_3
        WHERE rn <= CAST(
            CEILING(total_rows * (@percent_resultado / 100.0))
            AS INT
        )
    )
    SELECT
        ACT.easycode,
        ACT.contrato,
        ACT.tipo_resultado,
        ACT.contrato_n,
        ACT.contrato_n_gas,
        ACT.tel_marcado,
        ACT.logincontacto,
        ACT.duracao,
        ACT.recording_key,
        ACT.recording_moment AS moment,
        thg.itr_key AS global_recording_key,
        th.itr_global AS global_interaction,
        th.code AS interaction_id,
        th.start_time AS call_start,
        th.termination_state,
        ACT.resultado,
        th.contact_profile,
        th.media_type,
        th.origin
    FROM RESULTADOS ACT
    INNER JOIN itr_thread th WITH (NOLOCK)
        ON th.contact = ACT.easycode
    INNER JOIN itr_global thg WITH (NOLOCK)
        ON thg.code = th.itr_global
    WHERE th.start_time IS NOT NULL;
END;
      `);

    const rows: RecordingRow[] = result.recordset;
    return rows;
  }

  async saveSendRecordingLog(data: RecordingSendLog): Promise<void> {
    const conn = await connectPluricallDb("cloud");

    await conn
      .request()
      .input("recording_key", data.recording_key)
      .input("easycode", data.easycode)
      .input("telefone", data.telefone)
      .input("contrato", data.contrato)
      .input("contrato_n", data.contrato_n)
      .input("resultado", data.resultado)
      .input("ftps_source_path", data.ftps_source_path)
      .input("sftp_destination_path", data.sftp_destination_path)
      .input("file_name", data.file_name)
      .input("status", data.status)
      .input("error_type", data.error_type ?? null)
      .input("error_message", data.error_message ?? null).query(`
      INSERT INTO plenitude_recordings_log (
        recording_key,
        easycode,
        telefone,
        contrato,
        contrato_n,
        resultado,
        ftps_source_path,
        sftp_destination_path,
        file_name,
        status,
        error_type,
        error_message
      ) VALUES (
        @recording_key,
        @easycode,
        @telefone,
        @contrato,
        @contrato_n,
        @resultado,
        @ftps_source_path,
        @sftp_destination_path,
        @file_name,
        @status,
        @error_type,
        @error_message
      )
    `);
  }

  async findByRecKeys(recKeys: string[]): Promise<RecordingData[]> {
    const avr8 = await connectPluricallDb("panther", "avrcloud");

    const chunkSize = 500;
    const allResults: RecordingData[] = [];

    for (let i = 0; i < recKeys.length; i += chunkSize) {
      const chunk = recKeys.slice(i, i + chunkSize);
      const keys = chunk.map((key) => `'${key}'`).join(",");

      const result = await avr8.query(`
        SELECT rec_key, time_stamp, rec_time, file_size
        FROM recording
        WHERE rec_key IN (${keys})
      `);

      allResults.push(...result.recordset);
    }

    return allResults;
  }
}
