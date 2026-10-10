import { api } from "./client.js";

export const organizationsApi = {
  get: () => api.get("/api/org"),
  update: (patch) => api.put("/api/org", patch),
};
