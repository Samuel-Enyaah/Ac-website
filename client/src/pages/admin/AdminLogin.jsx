import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LockKeyhole,
  Mail,
  ShieldCheck,
  Snowflake,
} from "lucide-react";

import {
  useAdminAuth,
} from "../../context/AdminAuthContext";

export default function AdminLogin() {
  const {
    admin,
    login,
  } = useAdminAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  if (admin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSubmitting(true);
        setError("");

        await login({
          email,
          password,
        });

        navigate(
          location.state?.from ||
            "/admin",
          {
            replace: true,
          }
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to sign in."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="grid min-h-screen bg-[#F5F7FA] lg:grid-cols-2">

      <section className="hidden bg-[#0B1F33] p-12 text-white lg:flex lg:flex-col lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1687D9]">
            <Snowflake
              size={25}
            />
          </div>

          <div>
            <p className="text-xl font-black">
              R&J AC
            </p>

            <p className="text-xs text-white/50">
              ADMINISTRATION
            </p>
          </div>

        </div>

        <div className="max-w-lg">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#74C5FF]">
            Business Management
          </p>

          <h1 className="mt-4 text-5xl font-black leading-tight">
            Manage R&J from one
            secure workspace.
          </h1>

          <p className="mt-6 leading-8 text-white/60">
            Products, customer
            orders, service bookings,
            inventory and business
            operations will be managed
            from this dashboard.
          </p>

        </div>

        <div className="flex items-center gap-2 text-sm text-white/50">
          <ShieldCheck
            size={17}
          />

          Secure admin access
        </div>

      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">

        <div className="w-full max-w-md">

          <div className="mb-8 lg:hidden">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1687D9] text-white">
              <Snowflake
                size={25}
              />
            </div>

            <p className="mt-4 text-xl font-black text-[#0B1F33]">
              R&J AC Admin
            </p>

          </div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Admin Portal
          </p>

          <h1 className="mt-3 text-3xl font-black text-[#0B1F33]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Sign in with your
            administrator account.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8 space-y-5"
          >

            <label className="block">

              <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Email Address
              </span>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 outline-none transition focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
                />

              </div>

            </label>

            <label className="block">

              <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Password
              </span>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 outline-none transition focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10"
                />

              </div>

            </label>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="w-full rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF] disabled:opacity-60"
            >
              {submitting
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>

        </div>

      </section>

    </div>
  );
}