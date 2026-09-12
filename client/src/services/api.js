import axios from "axios";

function resolveBaseURL() {
  const raw = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).trim();
  const trimmed = raw.replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

let accessToken = null;
let unauthorizedHandler = null;
let refreshTimer = null;

export function setAccessToken(token) {
  accessToken = token || null;
  scheduleProactiveRefresh(token);
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function decodeJwtExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleProactiveRefresh(token) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (!token) return;

  const expiresAt = decodeJwtExpiry(token);
  if (!expiresAt) return;

  const REFRESH_MARGIN_MS = 60 * 1000;
  const delay = expiresAt - Date.now() - REFRESH_MARGIN_MS;

  if (delay <= 0) return;

  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(() => {});
  }, delay);
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const REFRESH_URL = "/auth/admin/refresh";
const NO_REFRESH_RETRY = [
  "/auth/admin/login",
  REFRESH_URL,
  "/auth/admin/logout",
];
function shouldSkipRefreshRetry(url = "") {
  return NO_REFRESH_RETRY.some((p) => url.includes(p));
}

let refreshPromise = null;

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/admin/refresh")
      .then((res) => {
        setAccessToken(res.data.token);
        return res.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { response, config } = err;

    if (!response) return Promise.reject(err);

    const status = response.status;

    if (
      status === 401 &&
      config &&
      !config._retry &&
      !shouldSkipRefreshRetry(config.url)
    ) {
      config._retry = true;
      try {
        const { token: newToken } = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshErr) {
        setAccessToken(null);
        unauthorizedHandler?.();
        return Promise.reject(refreshErr);
      }
    }

    if (
      status === 401 &&
      (config?.url?.includes(REFRESH_URL) || config?._retry)
    ) {
      setAccessToken(null);
      unauthorizedHandler?.();
    }

    return Promise.reject(err);
  },
);

export default api;
