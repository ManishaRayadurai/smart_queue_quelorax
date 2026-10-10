import { api } from "./client.js";

export const tokensApi = {
  getAll: () => api.get("/api/tokens"),
  getOne: (id) => api.get(`/api/tokens/${id}`),
  getByDepartment: (deptId) => api.get(`/api/tokens/department/${deptId}`),
  getByUser: (userId) => api.get(`/api/tokens/user/${userId}`),
  getWaiting: (deptId) => api.get(`/api/tokens/department/${deptId}/waiting`),
  getDelayed: (deptId) => api.get(`/api/tokens/department/${deptId}/delayed`),
  getMissed: (deptId) => api.get(`/api/tokens/department/${deptId}/missed`),
  getActiveForUser: (userId, departmentId) =>
    api.get("/api/tokens/active", { userId, departmentId }),

  create: (token) => api.post("/api/tokens", token),
  update: (id, patch) => api.put(`/api/tokens/${id}`, patch),

  cancel: (id) => api.post(`/api/tokens/${id}/cancel`),
  checkin: (id) => api.post(`/api/tokens/${id}/checkin`),
  delay: (id, minutes) => api.post(`/api/tokens/${id}/delay`, { minutes }),
  setPriority: (id, priority) => api.post(`/api/tokens/${id}/priority`, { priority }),
  reorder: (id, direction) => api.post(`/api/tokens/${id}/reorder`, { direction }),
  flagOverdue: (deptId) => api.post(`/api/tokens/department/${deptId}/flag-overdue`),
  call: (id) => api.post(`/api/tokens/${id}/call`),
  complete: (id) => api.post(`/api/tokens/${id}/complete`),
  skip: (id) => api.post(`/api/tokens/${id}/skip`),
};
