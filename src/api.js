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
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);

export const getCustomers = () => api.get("/api/customers");
export const createCustomer = (data) => api.post("/api/customers", data);
export const updateCustomer = (id, data) => api.put(`/api/customers/${id}`, data);

export const createInvoice = (data) => api.post("/api/invoices", data);
export const addInvoiceItem = (data) => api.post("/api/invoices/items", data);
export const getBillDetails = (invoiceId) => api.get(`/api/invoices/${invoiceId}/bill`);
export const getInvoiceHistory = () => api.get("/api/invoices/history");

export const getDailyReport = (date) => api.get(`/api/reports/daily?date=${date}`);
export const getMonthlyReport = (month, year) => api.get(`/api/reports/monthly?month=${month}&year=${year}`);
export const getDashboardChart = () => api.get("/api/reports/dashboard-chart");

// Admin APIs
export const getAdminStats = () => api.get("/api/admin/stats");
export const getAdminTenants = () => api.get("/api/admin/tenants");
export const toggleTenantStatus = (id) => api.put(`/api/admin/tenants/${id}/toggle`);

export default api;