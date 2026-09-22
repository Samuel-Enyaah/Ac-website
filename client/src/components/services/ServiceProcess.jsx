import {
  ClipboardList,
  CalendarCheck,
  Wrench,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Tell Us What You Need",
    description:
      "Choose the service and describe your AC issue or requirement.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Choose a Convenient Time",
    description:
      "Select your preferred service date and provide your location.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "R&J Handles the Job",
    description:
      "Our team reviews your request and arranges the required service.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Service Completed",
    description:
      "The job is completed and your service record is updated.",
  },
];

export default function ServiceProcess() {
  return (
    <section className="bg-[#F7FAFC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1687D9]">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#0B1F33] sm:text-4xl">
            Booking an AC Service Is Simple
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            We make it easy to request installation, repairs,
            servicing or diagnosis.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1687D9] text-white">
                    <Icon size={20} />
                  </div>

                  <span className="text-2xl font-black text-gray-100">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#0B1F33]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}