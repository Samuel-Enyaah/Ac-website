import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentAdmin,
  loginAdmin,
  logoutAdmin,
} from "../services/adminAuthService";

import { AdminAuthContext } from "./AdminAuthState";

export function AdminAuthProvider({
  children,
}) {
  const [admin, setAdmin] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadAdmin() {
      try {
        const data =
          await getCurrentAdmin();

        if (active) {
          setAdmin(data);
        }
      } catch {
        if (active) {
          setAdmin(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAdmin();

    return () => {
      active = false;
    };
  }, []);

  const login = async (
    credentials
  ) => {
    const data =
      await loginAdmin(
        credentials
      );

    setAdmin(data);

    return data;
  };

  const logout = async () => {
    try {
      await logoutAdmin();
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
