import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex min-h-[65vh] items-center justify-center bg-[#F8FAFC] px-4">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
          Page Not Found
        </p>

        <h1 className="mt-3 text-7xl font-extrabold text-[#0B1F33]">
          404
        </h1>

        <p className="mx-auto mt-4 max-w-md text-gray-600">
          The page you are looking for doesn't exist or
          may have been moved.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex rounded-xl bg-[#1687D9] px-6 py-3 font-semibold text-white"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}