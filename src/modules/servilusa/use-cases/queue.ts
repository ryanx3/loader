import { altitudeQueue } from "../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../shared/utils/generators/generate-dataload";

export interface ServilusaEncuesta {
  id: any;
  nif_cliente: any;
  codigo_centro: any;
  codigo_campanya: any;
  codigo_oleada: any;
  codigo_interno_cliente: any;
  codigo_pregunta: any;
  nombre_centro: any;
  email: any;
  telefono: any;
  nombre_encuestado: any;
  idioma: any;
  fecha_crea: any;
  campo01: any;
  campo02: any;
  campo03: any;
  campo04: any;
  campo05: any;
  campo06: any;
  campo07: any;
  campo08: any;
  campo09: any;
  campo10: any;
  otrosdatos: any;
  observaciones: any;
  skey: any;
  contactList: string;
  campaign: string;
  phoneNumber: string | number;
  genId: string;
}

export class Servilusa23081UploadContactsUseCase {
  private buildAltitudeField(Name: string, Value: any) {
    if (Name === "FirstName" && typeof Value === "string") {
      Value = Value.substring(0, 100);
    }

    if (Name === "MobilePhone" || Name === "HomePhone") {
      Value = String(Value ?? "").slice(-9);
    }

    return {
      discriminator: "DatabaseFields",
      Name,
      Value: Value ?? "",
      IsAnonymized: false,
    };
  }

  async execute(request: ServilusaEncuesta) {
    const dataload = generateDataload();

    const codigoPregunta = String(request.codigo_pregunta || "").substring(
      0,
      5,
    );
    const codigoCentro = String(request.codigo_centro || "").substring(0, 5);
    const codigoCampanya = String(request.codigo_campanya || "").substring(
      0,
      5,
    );

    const payload = {
      campaignName: request.campaign,
      contactCreateRequest: {
        Status: "Started",
        ContactListName: {
          RequestType: "Set",
          Value: request.contactList,
        },
        Attributes: [
          this.buildAltitudeField("HomePhone", request.phoneNumber),
          this.buildAltitudeField(
            "FirstName",
            String(request.nombre_encuestado),
          ),
          this.buildAltitudeField("observacoes", String(request.otrosdatos)),
          this.buildAltitudeField("lead_id", String(request.id)),
          this.buildAltitudeField("gen_id", String(request.genId)),
          this.buildAltitudeField("encuesta_id", String(request.id)),
          this.buildAltitudeField("nif", String(request.nif_cliente)),
          this.buildAltitudeField("codigo_centro", String(codigoCentro)),
          this.buildAltitudeField("codigo_campanya", String(codigoCampanya)),
          this.buildAltitudeField(
            "codigo_oleada",
            String(request.codigo_oleada),
          ),
          this.buildAltitudeField(
            "codigo_interno_cliente",
            String(request.codigo_interno_cliente),
          ),
          this.buildAltitudeField("codigo_pregunta", String(codigoPregunta)),
          this.buildAltitudeField(
            "nombre_centro",
            String(request.nombre_centro),
          ),
          this.buildAltitudeField("idioma", String(request.idioma)),
          this.buildAltitudeField("skey", String(request.skey)),
          this.buildAltitudeField("bd", "LEADS"),
          this.buildAltitudeField("dataload", String(dataload)),
          this.buildAltitudeField("plc_id", String(request.id)),
        ],
      },
    };

    await altitudeQueue.add("create-contact", {
      environment: "onprem",
      payload,
      genId: request.genId,
      repository: "servilusa",
    });
  }
}
