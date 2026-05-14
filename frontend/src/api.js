import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

export const getDashboardStats = () => api.get("/dashboard/");
export const getUnits = () => api.get("/units/");
export const getUnit = (id) => api.get(`/units/${id}/`);
export const createUnit = (data) => api.post("/units/", data);
export const updateUnit = (id, data) => api.put(`/units/${id}/`, data);
export const deleteUnit = (id) => api.delete(`/units/${id}/`);

export const getResidents = () => api.get("/residents/");
export const getResident = (id) => api.get(`/residents/${id}/`);
export const createResident = (data) => api.post("/residents/", data);
export const updateResident = (id, data) => api.put(`/residents/${id}/`, data);
export const deleteResident = (id) => api.delete(`/residents/${id}/`);

export const getPayments = () => api.get("/payments/");
export const createPayment = (data) => api.post("/payments/", data);
export const updatePayment = (id, data) => api.put(`/payments/${id}/`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}/`);
export const markPaymentPaid = (id) => api.post(`/payments/${id}/mark_paid/`);

export default api;
