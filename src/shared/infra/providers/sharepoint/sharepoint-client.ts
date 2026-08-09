import "dotenv/config";
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { env } from "../../../../env";

const tenantId = env.TENANT_ID!;
const clientId = env.CLIENT_ID!;
const clientSecret = env.CLIENT_SECRET!;

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

async function getToken(): Promise<string> {
  const token = await credential.getToken(
    "https://graph.microsoft.com/.default",
  );
  if (!token) throw new Error("Não foi possível obter token do Azure AD");
  return token.token;
}

const client = Client.init({
  authProvider: async (done) => {
    try {
      const token = await getToken();
      done(null, token);
    } catch (err) {
      done(err, null);
    }
  },
});

export default client;
