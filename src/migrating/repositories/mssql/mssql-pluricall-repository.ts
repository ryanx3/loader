import bcrypt from "bcryptjs";
import sql, { IResult } from "mssql";

import {
  ClientRecordingsParams,
  FetchRecordingKeyParams,
  GetClientRecordings,
  InsertInsight360ApiLogsDTO,
  LogPlenitudeCallCloud,
  RecordingDownloadInfo,
  RecordingFilters,
  RecordingKeyResult,
  RecordingMetadata,
} from "../types/pluricall-repository-types";
import { PluricallRepository } from "../pluricall-repository";
import { connectPluricallDb } from "../../../shared/infra/db/connect-pluricall";

export class MssqlPluricallRepository implements PluricallRepository {
  async logPlenitudeCallCloud(data: LogPlenitudeCallCloud) {
    const conn = await connectPluricallDb("cloud");
    await conn
      .request()
      .input("usuario", sql.NVarChar, data.usuario)
      .input("endpoint", sql.NVarChar, data.endpoint)
      .input(
        "request_payload",
        sql.NVarChar,
        JSON.stringify(data.requestPayload),
      )
      .input(
        "response_payload",
        sql.NVarChar,
        data.responsePayload ? JSON.stringify(data.responsePayload) : null,
      )
      .input("status_code", sql.Int, data.statusCode)
      .input("error_message", sql.NVarChar, data.errorMessage || null).query(`
        INSERT INTO plenitude_api_logs
        (usuario, endpoint, request_payload, response_payload, status_code, error_message)
        VALUES (@usuario, @endpoint, @request_payload, @response_payload, @status_code, @error_message)
      `);
  }

  async update(clientName: string) {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().input("clientName", clientName).query(`
      UPDATE insight_clients SET status = 'INACTIVO'
      WHERE client_name = @clientName
    `);

    return result.recordset;
  }

  async findByName(clientName: string): Promise<{ name: string } | null> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().input("clientName", clientName).query(`
      SELECT 
        client_name AS name
      FROM insight_clients
      WHERE client_name = @clientName AND status = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  async findByCampaign(
    ctName: string,
  ): Promise<{ id: number; campaign: string } | null> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().input("ct_", ctName).query(`
      SELECT 
        id,
        ct_ AS campaign
      FROM insight_clients
      WHERE ct_ = @ct_ AND status = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  async findClientByCampaignClient(
    ctName: string,
  ): Promise<{ id: number; name: string } | null> {
    const pool = await connectPluricallDb("onprem");
    const result = await pool.request().input("ct_", ctName).query(`
      SELECT c.id, c.client_name
      FROM insight_clients_login c
      INNER JOIN insight_clients r
        ON r.client_id = c.id
      WHERE r.ct_ = @ct_ AND r.status = 'ACTIVO'
    `);

    if (result.recordset.length === 0) return null;

    return {
      id: result.recordset[0].id,
      name: result.recordset[0].client_name,
    };
  }

  async findByEmail(email: string): Promise<{ email: string } | null> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().input("email", email).query(`
      SELECT 
        email
      FROM insight_clients_login
      WHERE email = @email AND status = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  }

  async getAll(): Promise<GetClientRecordings[]> {
    const pool = await connectPluricallDb("onprem");
    const result = await pool.query(`
    SELECT 
  client_name, 
  ct_, 
  percent_differents_result, 
  CONVERT(varchar(8), start_time, 108) AS startTime,
  status,
  is_bd,
  is_historical,
  folder_path,
  drive_id,
  site_id,
  results_not_in_five_percent
  FROM insight_clients WHERE status = 'ACTIVO';
  `);

    return result.recordset.map((row: any) => ({
      clientName: row.client_name,
      ct_: row.ct_,
      percentDifferentsResult: row.percent_differents_result,
      startTime: row.startTime,
      folderPath: row.folder_path,
      status: row.status,
      driveId: row.drive_id,
      isBd: row.is_bd,
      isHistorical: row.is_historical,
      resultsNotInFivePercent: row.results_not_in_five_percent,
      siteId: row.site_id,
    }));
  }

  async create(
    data: ClientRecordingsParams & { password?: string; email: string },
  ) {
    const pool = await connectPluricallDb("onprem");
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const plainPassword =
        data.password ?? Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      const insertClientResult = await transaction
        .request()
        .input("clientName", data.clientName)
        .input("email", data.email)
        .input("passwordHash", passwordHash).query(`
        INSERT INTO insight_clients_login (client_name, email, password_hash)
        OUTPUT INSERTED.id
        VALUES (@clientName, @email, @passwordHash)
      `);

      const clientId = insertClientResult.recordset[0]?.id;
      if (!clientId) throw new Error("Erro ao criar o cliente");

      await transaction
        .request()
        .input("clientId", clientId)
        .input("clientName", data.clientName)
        .input("ct_", data.ctName)
        .input("percentDifferentsResult", data.percentDifferentsResult)
        .input("startTime", data.startTime)
        .input("siteId", data.siteId)
        .input("driveId", data.driveId)
        .input("folderPath", data.folderPath ?? "")
        .input("status", data.status)
        .input("isBd", data.isBd ? 1 : 0)
        .input("isHistorical", data.isHistorical ? 1 : 0)
        .input("resultsNotInFivePercent", data.resultsNotInFivePercent).query(`
        INSERT INTO insight_clients
        (client_id, client_name, ct_, percent_differents_result, start_time, site_id, drive_id, folder_path, status, is_bd, is_historical, results_not_in_five_percent)
        VALUES (@clientId, @clientName, @ct_, @percentDifferentsResult, @startTime, @siteId, @driveId, @folderPath, @status, @isBd, @isHistorical, @resultsNotInFivePercent)
      `);

      await transaction.commit();

      return {
        ...data,
        clientId,
        password: plainPassword,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async fetchRecordings({
    ctName,
    day,
    percentDifferentsResult,
    isHistorical = false,
    resultsNotInFivePercent,
  }: FetchRecordingKeyParams): Promise<RecordingKeyResult[]> {
    const puma = await connectPluricallDb("onprem");
    const result = await puma.query(`
    BEGIN
    SET NOCOUNT ON;
    DECLARE @table_name   VARCHAR(50) = '${ctName}';
    DECLARE @dataini      DATETIME = '${day} 00:00:00';
    DECLARE @datafim      DATETIME = '${day} 23:59:59';
    DECLARE @percent_others INT = ${percentDifferentsResult};
    DECLARE @all_results  NVARCHAR(10) = '1';
    DECLARE @include_historical BIT = ${isHistorical === true ? 1 : 0};
    
    IF OBJECT_ID('tempdb..#RECORD_CT') IS NOT NULL DROP TABLE #RECORD_CT;
    IF OBJECT_ID('tempdb..#EASYCODES_RESULTADO1') IS NOT NULL DROP TABLE #EASYCODES_RESULTADO1;

    -- Tabela temporária para armazenar os easycodes com resultado 1 no período
    CREATE TABLE #EASYCODES_RESULTADO1 (
        easycode INT PRIMARY KEY
    );

    CREATE TABLE #RECORD_CT (
        easycode          INT,
        resultado         NVARCHAR(1),
        recording_key     VARCHAR(100),
        recording_moment  DATETIME,
        datacontacto      DATETIME,
        Resubmit          INT,
        plc_cod_bd        NVARCHAR(50),
        logincontacto     NVARCHAR(50),
        dt_entrada        DATETIME,
        comments          NVARCHAR(MAX),
        origem            NVARCHAR(MAX),
        tipo_bd           NVARCHAR(255),
        CP                NVARCHAR(255),
        bd                NVARCHAR(255) NULL,
        is_historical     BIT DEFAULT 0
    );

    DECLARE @schemaName SYSNAME, @viewName SYSNAME;
    DECLARE @fullView NVARCHAR(500);
    DECLARE @sql NVARCHAR(MAX);

    -- Coletar todos os easycodes com resultado 1 no período
    DECLARE table_cursor_collect CURSOR FOR
        SELECT SCHEMA_NAME(v.schema_id) AS schema_name, v.name
        FROM sys.views v
        WHERE v.name LIKE 'ct%' + @table_name + '%' 
          AND v.name NOT LIKE '%all%' 
          AND v.name NOT LIKE '%cloud%';

    OPEN table_cursor_collect;
    FETCH NEXT FROM table_cursor_collect INTO @schemaName, @viewName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @fullView = QUOTENAME(@schemaName) + N'.' + QUOTENAME(@viewName);

        DECLARE @has_datacontacto_collect INT, @has_easycode_collect INT, @has_resultado_collect INT;
        
        SELECT @has_datacontacto_collect = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'datacontacto';
        SELECT @has_easycode_collect = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'easycode';
        SELECT @has_resultado_collect = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'resultado';

        IF (@has_datacontacto_collect >= 1 AND @has_easycode_collect >= 1 AND @has_resultado_collect >= 1)
        BEGIN
            SET @sql = N'
INSERT INTO #EASYCODES_RESULTADO1 (easycode)
SELECT DISTINCT CAST(CT.easycode AS INT)
FROM ' + @fullView + N' AS CT WITH (NOLOCK)
WHERE CT.datacontacto BETWEEN @dataini AND @datafim
AND CT.resultado = @all_results
AND NOT EXISTS (
    SELECT 1 
    FROM #EASYCODES_RESULTADO1 E 
    WHERE E.easycode = CT.easycode
);';
            
            EXEC sp_executesql 
                @sql,
                N'@dataini DATETIME, @datafim DATETIME, @all_results NVARCHAR(10)',
                @dataini = @dataini,
                @datafim = @datafim,
                @all_results = @all_results;
        END

        FETCH NEXT FROM table_cursor_collect INTO @schemaName, @viewName;
    END

    CLOSE table_cursor_collect;
    DEALLOCATE table_cursor_collect;

    -- Processar as gravações do período (18/11) - TODOS os resultados do dia
    DECLARE table_cursor CURSOR FOR
        SELECT SCHEMA_NAME(v.schema_id) AS schema_name, v.name
        FROM sys.views v
        WHERE v.name LIKE 'ct%' + @table_name + '%' 
          AND v.name NOT LIKE '%all%' 
          AND v.name NOT LIKE '%cloud%';

    OPEN table_cursor;
    FETCH NEXT FROM table_cursor INTO @schemaName, @viewName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @fullView = QUOTENAME(@schemaName) + N'.' + QUOTENAME(@viewName);

        DECLARE 
            @has_plc INT, 
            @has_logincontacto INT, 
            @has_datacontacto INT, 
            @has_easycode INT, 
            @has_resultado INT,
            @has_bd INT;

        SELECT @has_plc = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'plc_cod_bd';
        SELECT @has_logincontacto = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'logincontacto';
        SELECT @has_datacontacto = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'datacontacto';
        SELECT @has_easycode = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'easycode';
        SELECT @has_resultado = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'resultado';
        SELECT @has_bd = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'bd';

        IF (@has_datacontacto >= 1 AND @has_easycode >= 1)
        BEGIN
            IF (@has_bd = 1)
            BEGIN
                SET @sql = N'
                INSERT INTO #RECORD_CT
                    (easycode, resultado, recording_key, recording_moment, datacontacto, Resubmit, plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, bd, is_historical)
                SELECT
                    CAST(CT.easycode AS INT) AS easycode,
                    ' + CASE WHEN @has_resultado = 1 THEN N'CAST(CT.resultado AS NVARCHAR(1))' ELSE N'NULL' END + N' AS resultado,
                    CAST(itr_record.recording_key AS VARCHAR(100)) AS recording_key,
                    itr_record.start_time AS recording_moment,
                    CT.datacontacto,
                    (SELECT COUNT(*) FROM activity_history WHERE activity = CT.easycode AND event_action = 3 AND event_moment <= @datafim) AS Resubmit,
                    ' + CASE WHEN @has_plc = 1 THEN N'CAST(CT.plc_cod_bd AS NVARCHAR(50))' ELSE N'NULL' END + N' AS plc_cod_bd,
                    ' + CASE WHEN @has_logincontacto = 1 THEN N'CAST(CT.logincontacto AS NVARCHAR(50))' ELSE N'NULL' END + N' AS logincontacto,
                    BD.dt_entrada,
                    CAST(BD.comments AS NVARCHAR(MAX)) AS comments,
                    BD.origem,
                    BD.tipo_bd,
                    N''' + @viewName + N''' AS CP,
                    CAST(CT.bd AS NVARCHAR(255)) AS bd,
                    0 AS is_historical  -- Não é histórico (são do dia 18)
                FROM itr_recording AS itr_record
                INNER JOIN ' + @fullView + N' AS CT WITH (NOLOCK) ON itr_record.contact = CT.easycode
                ' + CASE WHEN @has_plc = 1 
                        THEN N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON BD.cod_bd = CT.plc_cod_bd'
                        ELSE N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON 1=0' END + N'
                WHERE itr_record.start_time BETWEEN @dataini AND @datafim;';
            END
            ELSE
            BEGIN
                SET @sql = N'
                INSERT INTO #RECORD_CT
                    (easycode, resultado, recording_key, recording_moment, datacontacto, Resubmit, plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, is_historical)
                SELECT
                    CAST(CT.easycode AS INT) AS easycode,
                    ' + CASE WHEN @has_resultado = 1 THEN N'CAST(CT.resultado AS NVARCHAR(1))' ELSE N'NULL' END + N' AS resultado,
                    CAST(itr_record.recording_key AS VARCHAR(100)) AS recording_key,
                    itr_record.start_time AS recording_moment,
                    CT.datacontacto,
                    (SELECT COUNT(*) FROM activity_history WHERE activity = CT.easycode AND event_action = 3 AND event_moment <= @datafim) AS Resubmit,
                    ' + CASE WHEN @has_plc = 1 THEN N'CAST(CT.plc_cod_bd AS NVARCHAR(50))' ELSE N'NULL' END + N' AS plc_cod_bd,
                    ' + CASE WHEN @has_logincontacto = 1 THEN N'CAST(CT.logincontacto AS NVARCHAR(50))' ELSE N'NULL' END + N' AS logincontacto,
                    BD.dt_entrada,
                    CAST(BD.comments AS NVARCHAR(MAX)) AS comments,
                    BD.origem,
                    BD.tipo_bd,
                    N''' + @viewName + N''' AS CP,
                    0 AS is_historical  -- Não é histórico (são do dia 18)
                FROM itr_recording AS itr_record
                INNER JOIN ' + @fullView + N' AS CT WITH (NOLOCK) ON itr_record.contact = CT.easycode
                ' + CASE WHEN @has_plc = 1 
                        THEN N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON BD.cod_bd = CT.plc_cod_bd'
                        ELSE N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON 1=0' END + N'
                WHERE itr_record.start_time BETWEEN @dataini AND @datafim;';
            END
            EXEC sp_executesql 
                @sql,
                N'@dataini DATETIME, @datafim DATETIME',
                @dataini = @dataini,
                @datafim = @datafim;
        END

        FETCH NEXT FROM table_cursor INTO @schemaName, @viewName;
    END

    CLOSE table_cursor;
    DEALLOCATE table_cursor;

    -- Buscar o histórico completo para os easycodes com resultado 1 no dia 18 (se a flag estiver ativa)
    IF @include_historical = 1
    BEGIN
        DECLARE table_cursor_historical CURSOR FOR
            SELECT SCHEMA_NAME(v.schema_id) AS schema_name, v.name
            FROM sys.views v
            WHERE v.name LIKE 'ct%' + @table_name + '%' 
              AND v.name NOT LIKE '%all%' 
              AND v.name NOT LIKE '%cloud%';

        OPEN table_cursor_historical;
        FETCH NEXT FROM table_cursor_historical INTO @schemaName, @viewName;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @fullView = QUOTENAME(@schemaName) + N'.' + QUOTENAME(@viewName);

            DECLARE 
                @has_plc_hist INT, 
                @has_datacontacto_hist INT, 
                @has_easycode_hist INT, 
                @has_resultado_hist INT,
                @has_bd_hist INT,
                @has_logincontacto_hist INT;

            SELECT @has_plc_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'plc_cod_bd';
            SELECT @has_datacontacto_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'datacontacto';
            SELECT @has_easycode_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'easycode';
            SELECT @has_resultado_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'resultado';
            SELECT @has_bd_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'bd';
            SELECT @has_logincontacto_hist = COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @viewName AND COLUMN_NAME = 'logincontacto';

            IF (@has_datacontacto_hist >= 1 AND @has_easycode_hist >= 1)
            BEGIN
                IF (@has_bd_hist = 1)
                BEGIN
                    SET @sql = N'
                    INSERT INTO #RECORD_CT
                        (easycode, resultado, recording_key, recording_moment, datacontacto, Resubmit, plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, bd, is_historical)
                    SELECT
                        CAST(CT.easycode AS INT) AS easycode,
                        ' + CASE WHEN @has_resultado_hist = 1 THEN N'CAST(CT.resultado AS NVARCHAR(1))' ELSE N'NULL' END + N' AS resultado,
                        CAST(itr_record.recording_key AS VARCHAR(100)) AS recording_key,
                        itr_record.start_time AS recording_moment,
                        CT.datacontacto,
                        (SELECT COUNT(*) FROM activity_history WHERE activity = CT.easycode AND event_action = 3 AND event_moment <= itr_record.start_time) AS Resubmit,
                        ' + CASE WHEN @has_plc_hist = 1 THEN N'CAST(CT.plc_cod_bd AS NVARCHAR(50))' ELSE N'NULL' END + N' AS plc_cod_bd,
                        ' + CASE WHEN @has_logincontacto_hist = 1 THEN N'CAST(CT.logincontacto AS NVARCHAR(50))' ELSE N'NULL' END + N' AS logincontacto,
                        BD.dt_entrada,
                        CAST(BD.comments AS NVARCHAR(MAX)) AS comments,
                        BD.origem,
                        BD.tipo_bd,
                        N''' + @viewName + N''' AS CP,
                        CAST(CT.bd AS NVARCHAR(255)) AS bd,
                        1 AS is_historical  -- É histórico
                    FROM itr_recording AS itr_record
                    INNER JOIN ' + @fullView + N' AS CT WITH (NOLOCK) ON itr_record.contact = CT.easycode
                    ' + CASE WHEN @has_plc_hist = 1 
                            THEN N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON BD.cod_bd = CT.plc_cod_bd'
                            ELSE N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON 1=0' END + N'
                    WHERE CT.easycode IN (SELECT easycode FROM #EASYCODES_RESULTADO1)
                    AND itr_record.start_time IS NOT NULL
                    AND itr_record.start_time NOT BETWEEN @dataini AND @datafim;';  -- Exclui as do dia 18 que já foram capturadas
                END
                ELSE
                BEGIN
                    SET @sql = N'
                    INSERT INTO #RECORD_CT
                        (easycode, resultado, recording_key, recording_moment, datacontacto, Resubmit, plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, is_historical)
                    SELECT
                        CAST(CT.easycode AS INT) AS easycode,
                        ' + CASE WHEN @has_resultado_hist = 1 THEN N'CAST(CT.resultado AS NVARCHAR(1))' ELSE N'NULL' END + N' AS resultado,
                        CAST(itr_record.recording_key AS VARCHAR(100)) AS recording_key,
                        itr_record.start_time AS recording_moment,
                        CT.datacontacto,
                        (SELECT COUNT(*) FROM activity_history WHERE activity = CT.easycode AND event_action = 3 AND event_moment <= itr_record.start_time) AS Resubmit,
                        ' + CASE WHEN @has_plc_hist = 1 THEN N'CAST(CT.plc_cod_bd AS NVARCHAR(50))' ELSE N'NULL' END + N' AS plc_cod_bd,
                        ' + CASE WHEN @has_logincontacto_hist = 1 THEN N'CAST(CT.logincontacto AS NVARCHAR(50))' ELSE N'NULL' END + N' AS logincontacto,
                        BD.dt_entrada,
                        CAST(BD.comments AS NVARCHAR(MAX)) AS comments,
                        BD.origem,
                        BD.tipo_bd,
                        N''' + @viewName + N''' AS CP,
                        1 AS is_historical  -- É histórico
                    FROM itr_recording AS itr_record
                    INNER JOIN ' + @fullView + N' AS CT WITH (NOLOCK) ON itr_record.contact = CT.easycode
                    ' + CASE WHEN @has_plc_hist = 1 
                            THEN N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON BD.cod_bd = CT.plc_cod_bd'
                            ELSE N'LEFT JOIN plc_bd_log AS BD WITH (NOLOCK) ON 1=0' END + N'
                    WHERE CT.easycode IN (SELECT easycode FROM #EASYCODES_RESULTADO1)
                    AND itr_record.start_time IS NOT NULL
                    AND itr_record.start_time NOT BETWEEN @dataini AND @datafim;';  -- Exclui as do dia 18 que já foram capturadas
                END
                EXEC sp_executesql 
                    @sql,
                    N'@dataini DATETIME, @datafim DATETIME',
                    @dataini = @dataini,
                    @datafim = @datafim;
            END

            FETCH NEXT FROM table_cursor_historical INTO @schemaName, @viewName;
        END

        CLOSE table_cursor_historical;
        DEALLOCATE table_cursor_historical;
    END

    ;WITH DistinctOthers AS (
    SELECT DISTINCT easycode, resultado, recording_key, recording_moment, datacontacto, 
           Resubmit, plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, bd, is_historical
    FROM #RECORD_CT
    WHERE is_historical = 0 AND resultado NOT IN ('1', '0' ${resultsNotInFivePercent ? `, ${resultsNotInFivePercent}` : ""})
),
Sampled AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY resultado ORDER BY NEWID()) AS rn,
           COUNT(*) OVER (PARTITION BY resultado) AS total_por_resultado
    FROM DistinctOthers
),
    FinalData AS (
        -- Todos os resultados 1 do dia 18 (100%)
        SELECT * FROM #RECORD_CT WHERE is_historical = 0 AND resultado = '1'
        
        UNION ALL
        
        -- Dados históricos (se ativados) - TODOS os históricos
        SELECT * FROM #RECORD_CT WHERE is_historical = 1 AND @include_historical = 1
        
        UNION ALL
        
        -- Dados amostrados (5% dos outros resultados do dia 18)
        SELECT easycode, resultado, recording_key, recording_moment, datacontacto, Resubmit, 
               plc_cod_bd, logincontacto, dt_entrada, comments, origem, tipo_bd, CP, bd, is_historical
        FROM Sampled 
        WHERE rn <= CEILING(total_por_resultado * @percent_others / 100.0)
    )
    SELECT 
        ACT.CP as campanha,
        ACT.easycode,
        ACT.recording_key,
        ACT.recording_moment,
        thg.itr_key AS global_recording_key,
        th.itr_global AS global_interaction,
        th.code AS interaction_id,
        CONVERT(VARCHAR, ACT.datacontacto, 13) AS last_contact,
        ACT.Resubmit as resubmits,
        th.to_address,
        CONVERT(VARCHAR, th.start_time, 13) AS moment,
        CASE
            WHEN th.termination_state = '1'  THEN 'Handled'
            WHEN th.termination_state = '2'  THEN 'Busy'
            WHEN th.termination_state = '3'  THEN 'Machine'
            WHEN th.termination_state = '4'  THEN 'NoAnswer'
            WHEN th.termination_state = '5'  THEN 'Nuisance'
            WHEN th.termination_state = '6'  THEN 'Abandoned'
            WHEN th.termination_state = '7'  THEN 'Rejected'
            WHEN th.termination_state = '8'  THEN 'InvalidNumber'
            WHEN th.termination_state = '9'  THEN 'Overflow'
            WHEN th.termination_state = '10' THEN 'TrunkLineOverflow'
            WHEN th.termination_state = '11' THEN 'Redirected'
            WHEN th.termination_state = '12' THEN 'Modem'
            WHEN th.termination_state = '13' THEN 'Fax'
            WHEN th.termination_state = '14' THEN 'Discarded'
            WHEN th.termination_state = '15' THEN 'Routed'
            WHEN th.termination_state = '16' THEN 'AbortedByAgentLost'
            WHEN th.termination_state = '17' THEN 'Canceled'
            WHEN th.termination_state = '18' THEN 'ReEnqueued'
            ELSE CAST(th.termination_state AS VARCHAR(10))
        END AS termination_state,
        ACT.resultado AS resultado,
        CASE 
            WHEN ACT.resultado = 'I' THEN 'Informações'
            WHEN ACT.resultado = 'Y' THEN 'Não_Quer_Ser_Mais_Contactado'
            WHEN ACT.resultado = 'Q' THEN 'Não Quer Responder'
            WHEN ACT.resultado = 'O' THEN 'Inválido'
            WHEN ACT.resultado = 'E' THEN 'Número_errado'
            WHEN ACT.resultado = 'F' THEN 'Fax'
            WHEN ACT.resultado = 'M' THEN 'Remarcado_Maior_Que_3_Vezes'
            WHEN ACT.resultado = '1' THEN 'Interessado'
            WHEN ACT.resultado = '2' THEN 'Remarcado'
            WHEN ACT.resultado = '3' THEN 'Sem_Interesse'
            ELSE ACT.resultado 
        END AS resultado_description,
        (SELECT usr_name FROM ph_e_user WHERE code = th.e_user) AS logincontacto,
        th.extension,
        ACT.plc_cod_bd,
        ACT.bd AS bd,
        ACT.comments AS bd_comments,
        ACT.origem AS bd_origem,
        ACT.tipo_bd,
        th.service,
        th.campaign,
        th.directory,
        th.contact_profile,
        th.business_segment,
        th.media_type,
        th.origin,
        th.duration / 10 AS duration,
        th.wrapup_duration,
        th.from_address,
        thg.disconnection_type,
        ACT.is_historical
    FROM FinalData AS ACT
    INNER JOIN itr_thread AS th WITH (NOLOCK) ON th.contact = ACT.easycode
    INNER JOIN itr_global AS thg WITH (NOLOCK) ON thg.code = th.itr_global
    WHERE th.start_time IS NOT NULL
    ORDER BY ACT.resultado, th.start_time;
END
`);

    return result.recordset.map((result) => ({
      recording_key: result.recording_key,
      easycode: result.easycode,
      moment: result.recording_moment,
      telefone: result.telefone,
      bd: result.bd,
      campaign: result.campanha,
      resultado: result.resultado,
      duration: result.duration,
      loginContacto: result.logincontacto,
    }));
  }

  async saveSentRecordings(recording: RecordingMetadata) {
    const pool = await connectPluricallDb("onprem");

    await pool
      .request()
      .input("clientId", recording.clientId)
      .input("clientName", recording.clientName)
      .input("easycode", recording.easycode)
      .input("campaign", recording.campaign)
      .input("moment", recording.moment)
      .input("language", recording.language)
      .input("sharepointLocation", recording.sharepointLocation)
      .input("status", recording.status)
      .input("errorMessage", recording.errorMessage ?? null)
      .input("origem", recording.origem)
      .input("duration", recording.duration)
      .input("loginContacto", recording.loginContacto)
      .input("fileName", recording.fileName)
      .input("resultado", recording.resultado).query(`
        INSERT INTO insight_clients_recordings
          (client_id, client_name, easycode, campaign, moment,
           language, sharepoint_location, status, error_message, origem, file_name, duration, login_contacto, resultado)
        VALUES
          (@clientId, @clientName, @easycode, @campaign, @moment,
           @language, @sharepointLocation, @status, @errorMessage, @origem, @fileName, @duration, @loginContacto, @resultado)
      `);
  }

  async searchRecordingsByFilters(
    filters: RecordingFilters,
  ): Promise<RecordingMetadata[]> {
    const pool = await connectPluricallDb("onprem");
    const request = pool.request();

    let sql = `
    SELECT 
      easycode,
      moment,
      language,
      login_contacto,
      resultado,
      duration,
      sharepoint_location AS sharepointLocation,
      file_name
    FROM insight_clients_recordings
    WHERE client_id = @clientId
  `;
    request.input("clientId", filters.clientId);

    if (filters.easycode) {
      sql += " AND easycode = @easycode";
      request.input("easycode", filters.easycode);
    }

    if (filters.language) {
      sql += " AND language = @language";
      request.input("language", filters.language);
    }

    if (filters.startDate && filters.endDate) {
      sql += " AND CAST(moment AS DATE) BETWEEN @startDate AND @endDate";
      request.input("startDate", filters.startDate);
      request.input("endDate", filters.endDate);
    } else if (filters.startDate) {
      sql += " AND CAST(moment AS DATE) >= @startDate";
      request.input("startDate", filters.startDate);
    } else if (filters.endDate) {
      sql += " AND CAST(moment AS DATE) <= @endDate";
      request.input("endDate", filters.endDate);
    }

    sql += " ORDER BY moment ASC";

    const result = await request.query(sql);

    return result.recordset;
  }

  async getInfoToDownloadRecordings(
    easycode: string,
    clientId: string,
  ): Promise<IResult<RecordingDownloadInfo>> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool
      .request()
      .input("easycode", easycode)
      .input("clientId", clientId).query<RecordingDownloadInfo>(`
      SELECT
        cra.easycode,
        cra.client_name,
        cra.language,
        cra.moment,
        cra.duration,
        cra.file_name,
        cra.sharepoint_location,
        icr.site_id,
        icr.drive_id,
        icr.folder_path,
        icl.client_name AS clientNameLogin
      FROM insight_clients_recordings cra
      INNER JOIN insight_clients icr 
          ON cra.client_id = icr.client_id
          AND icr.status = 'ACTIVO'
      INNER JOIN insight_clients_login icl
          ON cra.client_id = icl.id
          AND icl.status = 'ACTIVO'
      WHERE cra.easycode = @easycode
        AND cra.client_id = @clientId
        AND cra.status = 'SUCCESS';
    `);

    return result;
  }

  async insertInsight360ApiLogs(
    data: InsertInsight360ApiLogsDTO,
  ): Promise<void> {
    try {
      const conn = await connectPluricallDb("onprem");

      await conn
        .request()
        .input("method", String(data.method))
        .input("route", String(data.route ?? ""))
        .input("request_url", String(data.requestUrl ?? ""))
        .input("request_ip", String(data.requestIp ?? ""))
        .input("headers", JSON.stringify(data.headers ?? {}))
        .input("body", JSON.stringify(data.body ?? {}))
        .input("query_params", JSON.stringify(data.queryParams ?? {}))
        .input("response_status", data.responseStatus ?? null)
        .input("error_message", String(data.errorMessage ?? "")).query(`
        INSERT INTO insight360api_logs (
          method,
          route,
          request_url,
          request_ip,
          headers,
          body,
          query_params,
          response_status,
          error_message
        )
        VALUES (
          @method,
          @route,
          @request_url,
          @request_ip,
          @headers,
          @body,
          @query_params,
          @response_status,
          @error_message
        )
      `);
    } catch (err) {
      console.error("Failed to insert request log:", err);
    }
  }
}
