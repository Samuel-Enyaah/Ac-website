import { Link } from "react-router-dom";
import {
  Home,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function SolutionsSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
            Cooling Solutions
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#0B1F33] sm:text-4xl">
            For Homes and Businesses
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <SolutionCard
            icon={Home}
            title="Residential Cooling"
            description="Comfortable and reliable air-conditioning solutions for houses, apartments and residential properties."
            items={[
              "Bedroom & living room AC installation",
              "Home AC servicing",
              "Repair and replacement",
              "Spare parts and accessories",
            ]}
          />

          <SolutionCard
            icon={Building2}
            title="Commercial Cooling"
            description="Cooling solutions for offices, shops, restaurants, institutions and other commercial spaces."
            items={[
              "Office AC installation",
              "Multi-unit installations",
              "Commercial maintenance",
              "Repair and system support",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function SolutionCard({
  icon: Icon,
  title,
  description,
  items,
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-[#F9FBFC] p-7 sm:p-8">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#1687D9] p-3 text-white">
        <Icon size={25} />
      </div>

      <h3 className="mt-5 text-2xl font-bold text-[#0B1F33]">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-600">
        {description}
      </p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-sm text-gray-700"
          >
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-[#1687D9]"
            />
            {item}
          </div>
        ))}
      </div>

      <Link
        to="/book-service"
        className="mt-7 inline-flex items-center gap-2 font-semibold text-[#1687D9]"
      >
        Book a Service
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}