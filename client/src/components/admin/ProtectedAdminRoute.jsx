import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../../context/AdminAuthContext";

export default function ProtectedAdminRoute() {
  const {
    admin,
    loading,
  } = useAdminAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#1687D9]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading admin...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}