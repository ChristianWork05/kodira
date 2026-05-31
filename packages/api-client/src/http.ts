import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

export type AccessToken = string;

export interface CreateHttpClientOptions {
  baseURL?: string;
  getAccessToken?: () => AccessToken | undefined | Promise<AccessToken | undefined>;
  refreshAccessToken?: () => Promise<AccessToken | undefined>;
  onRefreshError?: (error: unknown) => void;
}

type RequestConfigWithRetry = AxiosRequestConfig & { __isRetry?: boolean };

export function createHttpClient(options: CreateHttpClientOptions = {}): AxiosInstance {
  const http = axios.create({
    baseURL: options.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  let refreshPromise: Promise<AccessToken | undefined> | null = null;

  http.interceptors.request.use(async (config) => {
    const token = await options.getAccessToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalConfig = error.config as RequestConfigWithRetry | undefined;

      if (!originalConfig) throw error;

      const canRefresh =
        status === 401 &&
        !originalConfig.__isRetry &&
        typeof options.refreshAccessToken === 'function';

      if (!canRefresh) throw error;

      originalConfig.__isRetry = true;

      try {
        refreshPromise ??= options.refreshAccessToken!();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (!newToken) throw error;

        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return http.request(originalConfig);
      } catch (refreshError) {
        refreshPromise = null;
        options.onRefreshError?.(refreshError);
        throw error;
      }
    },
  );

  return http;
}
