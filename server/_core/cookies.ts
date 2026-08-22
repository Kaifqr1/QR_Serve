import { ENV } from "./env";

type HeaderValue = string | string[] | undefined;

export type RequestTransport = {
  protocol?: string;
  headers?: Record<string, HeaderValue>;
};

export type SessionCookieOptions = {
  httpOnly: true;
  path: "/";
  sameSite: "lax" | "none";
  secure: boolean;
};

function isSecureRequest(req: RequestTransport) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: RequestTransport
): SessionCookieOptions {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // The hosted development preview runs inside an iframe on a different site.
    // Its HTTPS requests need a third-party cookie; production remains same-origin.
    sameSite: !ENV.isProduction && secure ? "none" : "lax",
    secure,
  };
}
