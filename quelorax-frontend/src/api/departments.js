import { api } from "./client.js";

export const departmentsApi = {
  getAll: () => api.get("/api/departments"),
  getOne: (id) => api.get(`/api/departments/${id}`),
  create: (dept) => api.post("/api/departments", dept),
  update: (id, dept) => api.put(`/api/departments/${id}`, dept),
  remove: (id) => api.del(`/api/departments/${id}`),
};
