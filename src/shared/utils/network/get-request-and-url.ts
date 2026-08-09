import { FastifyRequest } from "fastify";

export function GetRequestIpAndUrl(request: FastifyRequest) {
  try {
    const forwarded = request.headers?.["x-forwarded-for"];

    let request_ip = "";

    if (typeof forwarded === "string" && forwarded.length > 0) {
      request_ip = forwarded.split(",")[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      request_ip = forwarded[0];
    } else if (request.ip) {
      request_ip = request.ip;
    }

    const protocol = request.protocol ?? "";
    const hostname = request.hostname ?? "";
    const rawUrl = request.raw?.url ?? "";

    const request_url =
      protocol && hostname && rawUrl
        ? `${protocol}://${hostname}${rawUrl}`
        : "";

    return {
      request_ip: request_ip || "",
      request_url: request_url || "",
    };
  } catch {
    return {
      request_ip: "NOT FOUND",
      request_url: "NOT FOUND",
    };
  }
}
