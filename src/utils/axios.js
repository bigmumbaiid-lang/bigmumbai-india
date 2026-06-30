import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 429 handler — converts rate-limit errors into a readable message
// so every page shows the same friendly error instead of a blank crash.
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 429) {
      const serverMsg = err.response.data?.message;
      const retryAfter = err.response.data?.retryAfter
        ?? parseInt(err.response.headers?.['retry-after'] ?? '60', 10);

      const mins = Math.ceil(retryAfter / 60);
      const timeLabel = mins >= 60
        ? `${Math.ceil(mins / 60)} hour${Math.ceil(mins / 60) > 1 ? 's' : ''}`
        : mins > 1 ? `${mins} minutes` : `${retryAfter} seconds`;

      err.message = serverMsg ?? `Too many requests. Please try again in ${timeLabel}.`;
      err.isRateLimit = true;
      err.retryAfter  = retryAfter;
    }
    return Promise.reject(err);
  }
);

export default instance;