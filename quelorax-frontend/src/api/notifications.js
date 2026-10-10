import { api } from "./client.js";

// Backend entity field is `message`, but the whole frontend (context +
// every page that calls push()) was built around `body`. Rather than touch
// every call site, we translate at the edges here so the rest of the app
// keeps working unchanged.
const fromBackend = (n) => ({ ...n, body: n.message });
const toBackend = ({ body, ...rest }) => ({ ...rest, message: body });

export const notificationsApi = {
  // Backend only supports "notifications relevant to this user" (own +
  // org-wide + their department + their role) — there's no admin
  // get-everything endpoint yet.
  getForUser: async (userId, role, departmentId) => {
    const data = await api.get("/api/notifications", { userId, role, departmentId });
    return data.map(fromBackend);
  },
  create: async (data) => fromBackend(await api.post("/api/notifications", toBackend(data))),
  markRead: (id, userId) => api.post(`/api/notifications/${id}/read?userId=${userId}`),
  markAllRead: (userId, role, departmentId) =>
    api.post("/api/notifications/read-all", { userId, role, departmentId }),
  delete: (id) => api.del(`/api/notifications/${id}`),
  clearAll: (userId, role, departmentId) =>
    api.post("/api/notifications/clear-all", { userId, role, departmentId }),
  registerFcmToken: (token) => api.post("/api/notifications/fcm-token", { token }),
  unregisterFcmToken: (token) => api.post("/api/notifications/fcm-token/unregister", { token }),
};
