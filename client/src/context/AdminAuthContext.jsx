import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api, { setAccessToken, setUnauthorizedHandler, refreshAccessToken } from "../services/api";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    if (isMounted.current) setAdmin(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await refreshAccessToken();
        if (cancelled) return;
        setAdmin(data.admin);
      } catch {

        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled && isMounted.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/admin/login", { email, password });
    setAccessToken(res.data.token);
    if (isMounted.current) setAdmin(res.data.admin);
    return res.data.admin;
  };

  const logout = () => {
    clearSession();

    api.post("/auth/admin/logout").catch(() => {});
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: Boolean(admin) }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
