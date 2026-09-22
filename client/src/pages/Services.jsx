import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Snowflake,
} from "lucide-react";

import ServiceCard from "../components/services/ServiceCard";
import ServiceProcess from "../components/services/ServiceProcess";
import { services } from "../data/services";

export default function Services() {
  return (
    <>
      <section className="bg-gradient-to-br from-[#EAF6FF] via-white to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1687D9]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1687D9] shadow-sm">
              <Snowflake size={16} />
              Professional Air Conditioning Services
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0B1F33] sm:text-5xl">
              Complete AC Services for
              <span className="text-[#1687D9]">
                {" "}
                Homes & Businesses.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
              From installation and repairs to maintenance and
              commercial cooling support, R&J provides dependable
              air-conditioning solutions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book-service"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-3.5 font-semibold text-white transition hover:bg-[#1176BF]"
              >
                Book a Service
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0B1F33]/15 bg-white px-6 py-3.5 font-semibold text-[#0B1F33] transition hover:border-[#1687D9] hover:text-[#1687D9]"
              >
                <PhoneCall size={18} />
                Contact Us
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#0B1F33] p-7 text-white shadow-2xl sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#74C5FF]">
              R&J AC
            </p>

            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              One company for your complete cooling needs.
            </h2>

            <div className="mt-7 space-y-4">
              {[
                "Air conditioner installation",
                "Professional AC repairs",
                "Servicing and preventive maintenance",
                "AC diagnosis and inspection",
                "Spare parts and accessories",
                "Residential and commercial solutions",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm text-white/75"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[#74C5FF]"
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
              What We Do
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#0B1F33] sm:text-4xl">
              Our AC Services
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Choose the service you need and submit a request.
              Our backend will later handle job tracking, technician
              assignment and booking references.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </div>
      </section>

      <ServiceProcess />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-[#1687D9] px-6 py-12 sm:px-10 lg:px-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                  Need Help?
                </p>

                <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Not sure which service you need?
                </h2>

                <p className="mt-4 max-w-2xl leading-7 text-white/80">
                  Describe the AC problem and R&J can review the request
                  and advise on the appropriate service.
                </p>
              </div>

              <Link
                to="/book-service"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#0B1F33",
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Request Assistance
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}