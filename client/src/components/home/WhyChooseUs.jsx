import {
  ShieldCheck,
  Wrench,
  Clock,
  CheckCircle2,
} from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Quality Service",
    text: "Professional workmanship and careful attention to every job.",
  },
  {
    icon: Wrench,
    title: "Complete AC Support",
    text: "Sales, installation, repairs, spare parts and servicing in one place.",
  },
  {
    icon: Clock,
    title: "Responsive Support",
    text: "Easy service booking and quick communication when assistance is needed.",
  },
  {
    icon: CheckCircle2,
    title: "Reliable Solutions",
    text: "Cooling solutions designed for homes, offices and commercial spaces.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-[#0B1F33] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#74C5FF]">
              Why R&J AC
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Reliable Cooling Solutions You Can Count On
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-white/65">
              Our goal is simple: help customers get the right cooling
              solution and provide dependable support throughout the life of
              their air-conditioning system.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => {
              const Icon = reason.icon;

              return (
                <div
                  key={reason.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1687D9]">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    {reason.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {reason.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}