export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const REQUEST_TIMEOUT_MS = 15000;
export const IS_API_CONFIGURED = API_URL.length > 0;
