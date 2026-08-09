import { z } from "zod";

const toStringOrEmpty = z.preprocess(
  (value) => (value == null ? "" : String(value)),
  z.string(),
);

const truncate = (max: number) =>
  z.preprocess((value) => {
    const str = value == null ? "" : String(value);
    return str.length > max ? str.slice(0, max) : str;
  }, z.string());

export const plenitudeBodySchema = z.object({
  environment: z.enum(["prod", "test"]).default("test"),
  digitalData: z.object({
    pais: toStringOrEmpty,
    fecha_entrada: toStringOrEmpty,
    fecha_comienzo: toStringOrEmpty,
    fecha_codificacion: toStringOrEmpty,
    cola_inicial: toStringOrEmpty,
    contrato: truncate(11),
    telefono: toStringOrEmpty,
    categorizacion: toStringOrEmpty,
    intentos: toStringOrEmpty,
    productos: toStringOrEmpty,
    source: toStringOrEmpty,
    id_lead: toStringOrEmpty,
    agente: toStringOrEmpty,
    cod_promo: toStringOrEmpty,
  }),
});
