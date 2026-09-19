const configuredBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();

if (!configuredBackendUrl) {
  throw new Error(
    "EXPO_PUBLIC_BACKEND_URL is required. Set it to your PC LAN or AWS backend URL.",
  );
}

const parsedBackendUrl = new URL(configuredBackendUrl);
if (!["http:", "https:"].includes(parsedBackendUrl.protocol)) {
  throw new Error("EXPO_PUBLIC_BACKEND_URL must use http:// or https://");
}
if (["localhost", "127.0.0.1", "::1"].includes(parsedBackendUrl.hostname)) {
  throw new Error(
    "EXPO_PUBLIC_BACKEND_URL must not use a loopback host for physical devices.",
  );
}

export const BACKEND_URL = configuredBackendUrl.replace(/\/+$/, "");
export const API_BASE_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;