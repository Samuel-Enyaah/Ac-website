export default function StatusMessage({ title, children, onRetry, error = false }) {
  return <div role={error ? "alert" : "status"} className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
    <p className="font-semibold text-[#0B1F33]">{title}</p>
    {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
    {onRetry && <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-[#1687D9] px-5 py-2 font-semibold text-white">Try again</button>}
  </div>;
}
