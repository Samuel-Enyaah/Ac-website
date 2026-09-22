import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function ServiceCard({ service }) {
  const Icon = service.icon;

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1687D9]/30 hover:shadow-xl sm:p-7">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#EAF6FF] p-3 text-[#1687D9] transition group-hover:bg-[#1687D9] group-hover:text-white">
        <Icon size={26} />
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#0B1F33]">
        {service.title}
      </h2>

      <p className="mt-3 text-sm leading-7 text-gray-600">
        {service.description}
      </p>

      <div className="mt-5 space-y-3">
        {service.features.slice(0, 4).map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-2 text-sm text-gray-700"
          >
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-[#1687D9]"
            />

            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-7">
        <Link
          to={`/book-service?service=${service.id}`}
          className="inline-flex items-center gap-2 font-semibold text-[#1687D9]"
        >
          Book This Service
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}