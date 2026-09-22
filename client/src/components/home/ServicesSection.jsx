import { Link } from "react-router-dom";
import {
  ArrowRight,
  Snowflake,
  Wrench,
  ShieldCheck,
  Package,
  Building2,
  Settings,
} from "lucide-react";

const services = [
  {
    icon: Snowflake,
    title: "AC Installation",
    description:
      "Professional installation for split, standing and commercial air-conditioning systems.",
  },
  {
    icon: Wrench,
    title: "AC Repairs",
    description:
      "Diagnosis and repair for cooling problems, leakage, electrical faults and more.",
  },
  {
    icon: ShieldCheck,
    title: "Servicing & Maintenance",
    description:
      "Routine cleaning and preventive maintenance to improve AC performance and lifespan.",
  },
  {
    icon: Package,
    title: "Spare Parts",
    description:
      "Quality AC spare parts and accessories for repair, replacement and installation.",
  },
  {
    icon: Building2,
    title: "Commercial Solutions",
    description:
      "Reliable cooling solutions for offices, shops, restaurants and other businesses.",
  },
  {
    icon: Settings,
    title: "AC Diagnosis",
    description:
      "Professional inspection to identify faults before repair work is carried out.",
  },
];

export default function ServicesSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
              Our Services
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B1F33] sm:text-4xl">
              Complete Air Conditioning Services
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Whether you need a new system installed or an existing AC
              repaired, R&J provides dependable support from start to finish.
            </p>
          </div>

          <Link
            to="/services"
            className="inline-flex items-center gap-2 font-semibold text-[#1687D9]"
          >
            View All Services
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1687D9]/30 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9] transition group-hover:bg-[#1687D9] group-hover:text-white">
                  <Icon size={23} />
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#0B1F33]">
                  {service.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}