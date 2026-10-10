import { api } from "./client.js";

export const authApi = {
  register: (name, email, phone, password) =>
    api.post("/api/auth/register", { name, email, phone, password }),

  verifyRegistration: (email, otp) =>
    api.post("/api/auth/verify-registration", { email, otp }),

  login: (email, password) =>
    api.post("/api/auth/login", { email, password }),

  requestLoginOtp: (email) =>
    api.post("/api/auth/login-otp/request", { email }),

  verifyLoginOtp: (email, otp) =>
    api.post("/api/auth/login-otp/verify", { email, otp }),

  forgotPassword: (email) =>
    api.post("/api/auth/forgot-password", { email }),

  resetPassword: (email, otp, newPassword) =>
    api.post("/api/auth/reset-password", { email, otp, newPassword }),

  me: () => api.get("/api/users/me"),
};
