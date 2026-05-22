import axios from "axios";

// cria uma instancia do axios com a url base do backend
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// adiciona o token automaticamente nas requisicoes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;