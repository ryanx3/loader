import { connectPluricallDb } from "../../../shared/infra/db/connect-pluricall";
import { MinisomDashboardDTO } from "../schemas/minisom-dashboard.schema";
import {
  MinisomDashboardResponse,
  MinisomLoadedContact,
  MinisomResultsBdType,
  MinisomSiteRepository,
} from "./minisom-site.repository";

export class MssqlMinisomSiteRepository implements MinisomSiteRepository {
  async getResultsByBdType(date: string): Promise<MinisomResultsBdType[]> {
    const conn = await connectPluricallDb("onprem");

    const result = await conn.request().input("date", date).query(`
         SELECT 
           FORMAT(a.datacontacto, 'yyyy-MM-dd') AS Data, 
           b.tipoBD AS TipoBD, 
           SUM(CASE WHEN a.resultado = '1' THEN 1 ELSE 0 END) AS Marcacoes
         FROM minisom_all_out_2022_act a
         INNER JOIN minisom_foxcc_numeros b 
           ON a.bd = b.codigoInterno
         WHERE a.datacontacto = @date
           AND b.tipoBD IN ('CL', 'PC', 'DIGITAL', 'LD') 
         GROUP BY a.datacontacto, b.tipoBD;
       `);

    return result.recordset;
  }

  async getLoadedContacts(): Promise<MinisomLoadedContact[]> {
    const conn = await connectPluricallDb("onprem");

    const result = await conn.request().query(`
      WITH TentativasPorContacto AS (
        SELECT
          contact,
          COUNT(code) AS tentativas
        FROM itr_thread
        GROUP BY contact
      )
      SELECT
        a.bd                          AS BD,
        b.tipoBD                      AS TipoBD,
        a.dataload                    AS Data,
        COUNT(a.EASYCODE)             AS Carregados,
        SUM(CASE WHEN a.resultado IN ('1','3') THEN 1 ELSE 0 END) AS UC,
        SUM(CASE WHEN a.resultado = '1'        THEN 1 ELSE 0 END) AS Marcacoes,
        CAST(
          1.0 * SUM(CASE WHEN a.resultado = '1' THEN 1 ELSE 0 END)
          / NULLIF(SUM(CASE WHEN a.resultado IN ('1','3') THEN 1 ELSE 0 END), 0)
          AS DECIMAL(5,2)
        ) AS Appt_UC,
        CAST(
          1.0 * SUM(CASE WHEN a.resultado = '1' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(a.EASYCODE), 0)
          AS DECIMAL(5,2)
        ) AS Appt_Carregados,
        SUM(ISNULL(t.tentativas, 0)) AS Tentativas,
        CAST(
          1.0 * SUM(ISNULL(t.tentativas, 0))
          / NULLIF(COUNT(a.EASYCODE) * 12, 0) * 100
          AS DECIMAL(5,2)
        ) AS SaturationRate
      FROM minisom_all_out_2022_act a
      INNER JOIN minisom_foxcc_numeros b
        ON a.bd = b.codigoInterno
      LEFT JOIN TentativasPorContacto t
        ON t.contact = a.EASYCODE
      WHERE LEN(a.plc_id) > 8
        AND a.dataload >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
        AND a.dataload <  DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
      GROUP BY a.bd, b.tipoBD, a.dataload
      ORDER BY a.dataload ASC
    `);

    return result.recordset;
  }

  async getDashboard({
    startDate,
    endDate,
    bd,
    tipoBD,
  }: MinisomDashboardDTO): Promise<MinisomDashboardResponse> {
    const conn = await connectPluricallDb("onprem");
    let query = `
      SELECT
        FORMAT(MIN(a.datacontacto), 'yyyy-MM-dd') AS Data,
        b.tipoBD                                   AS TipoBD,
        b.codigoInterno                            AS BD,
        COUNT(a.EASYCODE)                          AS Carregados,
        SUM(CASE WHEN a.resultado = '1'             THEN 1 ELSE 0 END) AS Marcacoes,
        SUM(CASE WHEN a.resultado IN ('1','3')       THEN 1 ELSE 0 END) AS Contatos_uteis,
        SUM(CASE WHEN AC.status IN (2, 3, 19)        THEN 1 ELSE 0 END) AS Contatos_fechados,
        SUM(CASE WHEN AC.status = 10                 THEN 1 ELSE 0 END) AS Virgens
      FROM minisom_all_out_2022_act a
      INNER JOIN activity AC
        ON AC.code = a.easycode
      INNER JOIN minisom_foxcc_numeros b
        ON a.bd = b.codigoInterno
      WHERE a.dataload BETWEEN @startDate AND @endDate
    `;

    if (bd.length > 0) {
      query += ` AND b.codigoInterno IN (${bd.map((_, i) => `@bd${i}`).join(", ")})`;
    }

    if (tipoBD.length > 0) {
      query += ` AND b.tipoBD IN (${tipoBD.map((_, i) => `@tipo${i}`).join(", ")})`;
    }

    query += `
      GROUP BY b.codigoInterno, b.tipoBD, a.campanha
      ORDER BY b.tipoBD
    `;

    const req = conn.request();
    req.input("startDate", startDate);
    req.input("endDate", endDate);
    bd.forEach((val, i) => req.input(`bd${i}`, val));
    tipoBD.forEach((val, i) => req.input(`tipo${i}`, val));

    const [data, bds, tipoBDs] = await Promise.all([
      req.query(query),
      conn
        .request()
        .query(
          `SELECT DISTINCT codigoInterno AS BD FROM minisom_foxcc_numeros`,
        ),
      conn
        .request()
        .query(`SELECT DISTINCT tipoBD AS TipoBD FROM minisom_foxcc_numeros`),
    ]);

    return {
      data: data.recordset,
      bds: bds.recordset,
      tipoBDs: tipoBDs.recordset,
    };
  }
}
