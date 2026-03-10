import axios from "axios";

const BASE_URL = "http://localhost:8001";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerTenant = (data) =>
  api.post("/api/auth/register-tenant", data);

export const loginUser = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return api.post("/api/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const getProducts = () => api.get("/api/products");
export const createProduct = (data) => api.post("/api/products", data);

export const getCustomers = () => api.get("/api/customers");
export const createCustomer = (data) => api.post("/api/customers", data);

export const createInvoice = (data) => api.post("/api/invoices", data);
export const addInvoiceItem = (data) => api.post("/api/invoices/items", data);
export const getBillDetails = (invoiceId) => api.get(`/api/invoices/${invoiceId}/bill`);
export const getInvoiceHistory = () => api.get("/api/invoices/history");

export default api;