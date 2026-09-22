import {
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Snowflake,
  Users,
  Wrench,
  X,
} from "lucide-react";

import {
  useAdminAuth,
} from "../context/AdminAuthContext";

const links = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },

  {
    label: "Orders",
    path: "/admin/orders",
    icon: ClipboardList,
  },

  {
    label: "Service Bookings",
    path: "/admin/bookings",
    icon: Wrench,
  },

  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
  },

  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: Boxes,
  },

  {
    label: "Customers",
    path: "/admin/customers",
    icon: Users,
  },

  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout() {
  const {
    admin,
    logout,
  } = useAdminAuth();

  const navigate =
    useNavigate();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const handleLogout =
    async () => {
      await logout();

      navigate(
        "/admin/login",
        {
          replace: true,
        }
      );
    };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0B1F33] text-white transition-transform lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1687D9]">
              <Snowflake
                size={21}
              />
            </div>

            <div>
              <p className="font-black">
                R&J AC
              </p>

              <p className="text-[10px] uppercase tracking-wider text-white/45">
                Admin Portal
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="rounded-lg p-2 text-white/70 lg:hidden"
          >
            <X size={21} />
          </button>

        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">

          {links.map(
            ({
              label,
              path,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className={({
                  isActive,
                }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#1687D9] text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon
                  size={19}
                />

                {label}
              </NavLink>
            )
          )}

        </nav>

        <div className="border-t border-white/10 p-4">

          <div className="mb-4 px-3">

            <p className="truncate text-sm font-semibold">
              {admin?.name}
            </p>

            <p className="mt-1 truncate text-xs text-white/45">
              {admin?.email}
            </p>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/65 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut
              size={18}
            />

            Sign Out
          </button>

        </div>

      </aside>

      <div className="lg:pl-72">

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              className="rounded-xl border border-gray-200 p-2.5 text-[#0B1F33] lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm text-gray-500">
                R&J AC
              </p>

              <p className="font-bold text-[#0B1F33]">
                Administration
              </p>
            </div>

          </div>

          <div className="hidden text-right sm:block">

            <p className="text-sm font-semibold text-[#0B1F33]">
              {admin?.name}
            </p>

            <p className="text-xs capitalize text-gray-500">
              {admin?.role?.replace(
                "_",
                " "
              )}
            </p>

          </div>

        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}