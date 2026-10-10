import { api } from "./client.js";

export const usersApi = {
  getAll: () => api.get("/api/users"),
  getOne: (id) => api.get(`/api/users/${id}`),
  me: () => api.get("/api/users/me"),

  // POST /api/users accepts a lowercase role string and uppercases it
  // server-side, so no conversion needed here.
  create: (user) => api.post("/api/users", user),

  // PUT /api/users/{id} binds directly to the JPA entity, whose `role`
  // field is a Java enum (ADMIN | STAFF | RECEPTIONIST | VISITOR) -
  // Jackson requires an exact uppercase match to deserialize it, so we
  // uppercase here before sending.
  update: (id, patch) =>
    api.put(`/api/users/${id}`, {
      ...patch,
      role: patch.role ? patch.role.toUpperCase() : undefined,
    }),

  updateProfileImage: (id, profileImage) =>
    api.post(`/api/users/${id}/profile-image`, { profileImage }),
  remove: (id) => api.del(`/api/users/${id}`),
  loginStats: () => api.get("/api/users/stats/login"),
};
