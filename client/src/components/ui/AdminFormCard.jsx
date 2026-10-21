export default function AdminFormCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex items-start gap-3 border-b border-gray-100 pb-5">

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <Icon
              size={19}
            />
          </div>
        )}

        <div>

          <h2 className="font-bold text-[#0B1F33]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}

        </div>

      </div>

      <div className="pt-6">
        {children}
      </div>

    </section>
  );
}

