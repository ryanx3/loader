import * as XLSX from "xlsx";
import axios from "axios";

type Lead = {
  phone_number: string;
  lead_id: string;
  form_id: string;
  email: string;
  full_name: string;
};

async function importarLeads() {
  const workbook = XLSX.readFile("./leads.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const leads: Lead[] = XLSX.utils.sheet_to_json(sheet, {
    raw: false,
  });

  let i = 0;

  for (const lead of leads) {
    i++;

    const params = new URLSearchParams();
    params.append("phone_number", lead.phone_number);
    params.append("lead_id", lead.lead_id);
    params.append("form_id", lead.form_id);
    params.append("email", lead.email);
    params.append("full_name", lead.full_name);

    try {
      const res = await axios.post(
        "https://lince.centrocontacto.cc/ws/minisom/meta",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      console.log(`✅ Lead ${i} carregada: ${lead.full_name}`);
      console.log(`${res.data} ✅ Lead ${i} carregada: ${lead.full_name}`);
    } catch (error: any) {
      if (error.response) {
        console.log(
          `⚠️ Lead ${i} (${lead.full_name}) erro ${error.response.status}:`,
          error.response.data,
        );
      } else {
        console.log(
          `❌ Lead ${i} (${lead.full_name}) erro de rede:`,
          error.message,
        );
      }
    }
  }

  console.log("🎉 Importação terminada");
}

importarLeads();
