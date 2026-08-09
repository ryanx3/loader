import { parseString } from "xml2js";
import { FastifyRequest, FastifyReply } from "fastify";
import { makeServilusa23081UseCase } from "../../use-cases/factories/servilusa-23081.factory";
import { GetRequestIpAndUrl } from "../../../../shared/utils/network/get-request-and-url";

export interface ServilusaEncuestaSchema {
  id: string | number;
  nif_cliente: string;
  codigo_centro: string | number;
  codigo_campanya: string | number;
  codigo_oleada: string | number;
  codigo_interno_cliente: string;
  codigo_pregunta: string | number;
  nombre_centro: string;
  email: string;
  telefono: string;
  nombre_encuestado: string;
  idioma: string;
  fecha_crea: string;
  campo01: string;
  campo02: string;
  campo03: string;
  campo04: string;
  campo05: string;
  campo06: string;
  campo07: string;
  campo08: string;
  campo09: string;
  campo10: string;
  otrosdatos: string;
  observaciones?: string;
  skey: string;
}

export interface ServilusaRequest {
  encuesta: ServilusaEncuestaSchema;
  request_ip: string;
  request_url: string;
  formdata: Record<string, any>;
}

interface XmlEncuesta {
  id: string;
  nif_cliente: string;
  codigo_centro: string;
  codigo_campanya: string;
  codigo_oleada: string;
  codigo_interno_cliente: string;
  codigo_pregunta: string;
  nombre_centro: string;
  email: string;
  telefono: string;
  nombre_encuestado: string;
  idioma: string;
  fecha_crea: string;
  campo01: string;
  campo02: string;
  campo03: string;
  campo04: string;
  campo05: string;
  campo06: string;
  campo07: string;
  campo08: string;
  campo09: string;
  campo10: string;
  otrosdatos: string;
  observaciones?: string;
  skey: string;
}

interface XmlCampanya {
  $: { id: string };
  encuesta: XmlEncuesta | XmlEncuesta[];
}

interface XmlListaEncuestas {
  lista_encuestas: {
    campanya: XmlCampanya | XmlCampanya[];
  };
}

const parseXmlAsync = async (
  xml: string,
  options?: any,
): Promise<XmlListaEncuestas> => {
  return new Promise((resolve, reject) => {
    parseString(xml, options || {}, (err, result) => {
      if (err) reject(err);
      else resolve(result as XmlListaEncuestas);
    });
  });
};

function ensureArray<T>(item: T | T[]): T[] {
  return Array.isArray(item) ? item : [item];
}

export async function servilusa23081(
  request: FastifyRequest<{ Body: string }>,
  reply: FastifyReply,
) {
  try {
    const { request_ip, request_url } = GetRequestIpAndUrl(request);

    const xmlString = request.body;
    if (!xmlString || xmlString.trim() === "") {
      return reply
        .status(400)
        .header("Content-Type", "application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ERROR</status>\n  <message>XML não fornecido</message>\n</response>',
        );
    }

    let parsedXml: XmlListaEncuestas;
    try {
      parsedXml = await parseXmlAsync(xmlString, {
        explicitArray: false,
        trim: true,
        normalize: true,
        normalizeTags: false,
        explicitRoot: true,
      });
    } catch (parseError) {
      console.error("Erro ao parsear XML:", parseError);
      return reply
        .status(400)
        .header("Content-Type", "application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ERROR</status>\n  <message>Erro ao processar XML: formato inválido</message>\n</response>',
        );
    }

    const listaEncuestas = parsedXml.lista_encuestas;
    if (!listaEncuestas || !listaEncuestas.campanya) {
      return reply
        .status(400)
        .header("Content-Type", "application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ERROR</status>\n  <message>Estrutura XML inválida: tag campanya não encontrada</message>\n</response>',
        );
    }

    const campanhas = ensureArray(listaEncuestas.campanya);

    const todasEncuestas: ServilusaEncuestaSchema[] = [];
    const idsRecebidos: string[] = [];

    for (const campanha of campanhas) {
      const encuestas = ensureArray(campanha.encuesta);

      for (const encuesta of encuestas) {
        const encuestaData: ServilusaEncuestaSchema = {
          id: encuesta.id || "",
          nif_cliente: encuesta.nif_cliente || "",
          codigo_centro: encuesta.codigo_centro || "",
          codigo_campanya: encuesta.codigo_campanya || "",
          codigo_oleada: encuesta.codigo_oleada || "",
          codigo_interno_cliente: encuesta.codigo_interno_cliente || "",
          codigo_pregunta: encuesta.codigo_pregunta || "",
          nombre_centro: encuesta.nombre_centro || "",
          email: encuesta.email || "",
          telefono: encuesta.telefono || "",
          nombre_encuestado: encuesta.nombre_encuestado || "",
          idioma: encuesta.idioma || "pt",
          fecha_crea: encuesta.fecha_crea || "",
          campo01: encuesta.campo01 || "",
          campo02: encuesta.campo02 || "",
          campo03: encuesta.campo03 || "",
          campo04: encuesta.campo04 || "",
          campo05: encuesta.campo05 || "",
          campo06: encuesta.campo06 || "",
          campo07: encuesta.campo07 || "",
          campo08: encuesta.campo08 || "",
          campo09: encuesta.campo09 || "",
          campo10: encuesta.campo10 || "",
          otrosdatos: encuesta.otrosdatos || "",
          observaciones: encuesta.observaciones || "",
          skey: encuesta.skey || "",
        };

        todasEncuestas.push(encuestaData);
        idsRecebidos.push(String(encuesta.id));
      }
    }

    if (todasEncuestas.length === 0) {
      return reply
        .status(400)
        .header("Content-Type", "application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ERROR</status>\n  <message>Nenhuma encuesta encontrada no XML</message>\n</response>',
        );
    }

    const servilusaUseCase = makeServilusa23081UseCase();

    setImmediate(async () => {
      for (const encuesta of todasEncuestas) {
        try {
          await servilusaUseCase.execute(encuesta, request_ip, request_url);
        } catch (error) {
          console.error(
            `Erro ao processar encuesta ${encuesta.id} na fila:`,
            error,
          );
        }
      }
    });

    const encuestasXml = idsRecebidos
      .map(
        (id) => `
    <encuesta>
      <id>${id}</id>
    </encuesta>`,
      )
      .join("");

    const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<lista_encuestas>
${encuestasXml}
</lista_encuestas>`;

    return reply
      .status(200)
      .header("Content-Type", "application/xml")
      .send(responseXml);
  } catch (error) {
    console.error("Erro geral no servidor:", error);
    return reply
      .status(500)
      .header("Content-Type", "application/xml")
      .send(
        '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ERROR</status>\n  <message>Internal server error</message>\n</response>',
      );
  }
}
