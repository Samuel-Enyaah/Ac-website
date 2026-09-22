import { PhoneCall } from "lucide-react";

export default function Contact() {
  return (
    <section className="min-h-[60vh] bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <PhoneCall size={23} />
          </div>

          <p className="font-semibold text-[#1687D9]">
            Get In Touch
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#0B1F33]">
            Contact R&J AC
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            Our full contact details, WhatsApp, location
            and enquiry form will be added here.
          </p>
        </div>
      </div>
    </section>
  );
}