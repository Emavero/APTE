import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (
    token &&
    !config.url.includes("/users/register/") &&
    !config.url.includes("/users/login/")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
