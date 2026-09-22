import { Link } from "react-router-dom";
import {
  ArrowRight,
  PhoneCall,
} from "lucide-react";

export default function HomeCTA() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#1687D9] to-[#0D6CAD] px-6 py-12 sm:px-10 lg:px-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                Need AC Assistance?
              </p>

              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Need installation, repairs or servicing?
              </h2>

              <p className="mt-4 leading-7 text-white/80">
                Tell us what you need and R&J AC will help you find
                the right cooling solution.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book-service"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#0B1F33",
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Book a Service
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                style={{
                  color: "#ffffff",
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 font-bold transition duration-300 hover:bg-white/20"
              >
                <PhoneCall size={18} />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}