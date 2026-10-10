import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

// Backend returns role as an uppercase enum (ADMIN, STAFF, RECEPTIONIST,
// VISITOR). The rest of this frontend was built expecting lowercase role
// strings for routing/checks, so normalize here in one place.
function normalizeUser(u) {
  if (!u) return u;
  const rawAvatar = u.profileImage;
  let avatar = null;

  if (rawAvatar && typeof rawAvatar === "string" && rawAvatar.trim() !== "" && rawAvatar !== "null") {
    avatar = rawAvatar;
    if (u.id) {
      localStorage.setItem(`qx_avatar_${u.id}`, avatar);
    }
  } else if (u.id) {
    if (rawAvatar === undefined) {
      avatar = localStorage.getItem(`qx_avatar_${u.id}`) || null;
    } else {
      localStorage.removeItem(`qx_avatar_${u.id}`);
      avatar = null;
    }
  }

  return {
    ...u,
    role: u.role ? u.role.toLowerCase() : u.role,
    profileImage: avatar,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a JWT is already saved, ask the backend who we are.
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const me = await authApi.me();
          setUser(normalizeUser(me));
        } catch {
          // token expired/invalid — clear it
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    const me = await authApi.me();
    setUser(normalizeUser(me));
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(normalizeUser(res.user));
    return res.user;
  };

  const requestLoginOtp = async (email) => {
    const res = await authApi.requestLoginOtp(email);
    return res.message; // backend sends the real code by email/SMS; only a status message comes back
  };

  const loginWithOtp = async (email, otp) => {
    const res = await authApi.verifyLoginOtp(email, otp);
    setToken(res.token);
    setUser(normalizeUser(res.user));
    return res.user;
  };

  // The raw Google ID token is sent to the backend, which verifies it
  // server-side (signature, expiry, audience) before trusting any of its
  // claims — see AuthService.loginWithGoogle / GoogleTokenVerifier.
  const loginWithGoogle = async (credential) => {
    const res = await authApi.google(credential);
    setToken(res.token);
    setUser(normalizeUser(res.user));
    return res.user;
  };

  const register = async ({ name, email, phone, password }) => {
    const res = await authApi.register(name, email, phone, password);
    return { message: res.message }; // backend sends the real code by email/SMS; only a status message comes back
  };

  const resendRegistrationOtp = async (email) => {
    const res = await authApi.resendRegistrationOtp(email);
    return res.message;
  };

  const verifyRegistration = async (email, otp) => {
    const res = await authApi.verifyRegistration(email, otp);
    setToken(res.token);
    setUser(normalizeUser(res.user));
    return res.user;
  };

  const requestReset = async (email) => {
    const res = await authApi.forgotPassword(email);
    return res.message; // backend sends the real code by email/SMS; only a status message comes back
  };

  const confirmReset = async (email, otp, newPassword) => {
    const res = await authApi.resetPassword(email, otp, newPassword);
    setToken(res.token);
    setUser(normalizeUser(res.user));
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    if (updatedData) {
      setUser((prev) => normalizeUser({ ...prev, ...updatedData }));
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      requestLoginOtp,
      loginWithOtp,
      loginWithGoogle,
      register,
      resendRegistrationOtp,
      verifyRegistration,
      requestReset,
      confirmReset,
      logout,
      refresh,
      updateUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
