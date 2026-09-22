import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Snowflake,
  Wrench,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="overflow-hidden bg-gradient-to-br from-[#EAF6FF] via-white to-[#F7FBFF]">
      <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1687D9]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1687D9] shadow-sm">
            <Snowflake size={16} />
            Complete Air Conditioning Solutions
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-[#0B1F33] sm:text-5xl lg:text-6xl">
            Reliable Cooling for
            <span className="text-[#1687D9]"> Homes & Businesses.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
            Shop quality air conditioners and spare parts, or book
            professional installation, repairs, servicing and maintenance
            with R&J AC.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#1176BF]"
            >
              Shop Air Conditioners
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/book-service"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0B1F33]/15 bg-white px-6 py-3.5 font-semibold text-[#0B1F33] transition hover:border-[#1687D9] hover:text-[#1687D9]"
            >
              Book a Service
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
            {[
              "Professional Installation",
              "Reliable AC Repairs",
              "Quality Spare Parts",
              "Residential & Commercial",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-[#1687D9]"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-12 top-12 h-44 w-44 rounded-full bg-[#1687D9]/10 blur-3xl" />
          <div className="absolute -bottom-12 right-0 h-52 w-52 rounded-full bg-[#F59E0B]/10 blur-3xl" />

          <div className="relative rounded-[2rem] bg-[#0B1F33] p-6 shadow-2xl sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#74C5FF]">
                R&J AC SERVICES
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Everything you need to stay cool.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                From buying a new AC to servicing an existing unit, we
                provide complete air-conditioning solutions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HeroCard
                icon={ShoppingBag}
                title="AC Sales"
                description="Air conditioners for homes, offices and commercial spaces."
              />

              <HeroCard
                icon={Wrench}
                title="Repairs"
                description="Professional diagnosis and reliable AC repair services."
              />

              <HeroCard
                icon={Snowflake}
                title="Installation"
                description="Clean and professional air-conditioner installation."
              />

              <HeroCard
                icon={ShieldCheck}
                title="Maintenance"
                description="Regular servicing to keep your system performing properly."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:bg-white/[0.1]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1687D9] text-white">
        <Icon size={21} />
      </div>

      <h3 className="mt-4 font-bold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/60">
        {description}
      </p>
    </div>
  );
}