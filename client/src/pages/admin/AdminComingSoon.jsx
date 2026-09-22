export default function AdminComingSoon({
  title,
}) {
  return (
    <div>

      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
        R&J Admin
      </p>

      <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
        {title}
      </h1>

      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-8">

        <p className="text-gray-600">
          The {title.toLowerCase()}
          management system will be
          implemented in the next
          stage.
        </p>

      </div>

    </div>
  );
}