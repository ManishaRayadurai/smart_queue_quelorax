import { api } from "./client.js";

export const documentsApi = {
  getByUser: (userId) => api.get(`/api/documents/user/${userId}`),
  // Only send fields that exist on the backend entity (id, userId, name,
  // type, fileUrl, status, uploadedAt) — anything else gets rejected.
  create: (doc) => api.post("/api/documents", doc),
  update: (id, patch) => api.put(`/api/documents/${id}`, patch),
  remove: (id) => api.del(`/api/documents/${id}`),
};
