import {
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MapPin,
  Wrench,
} from "lucide-react";

import {
  useBusinessSettings,
} from "../context/BusinessSettingsContext";

import * as bookingService from "../services/serviceBookingService";

const serviceTypes = [
  {
    value: "installation",
    label: "AC Installation",
  },
  {
    value: "repairs",
    label: "AC Repairs",
  },
  {
    value: "maintenance",
    label:
      "Servicing & Maintenance",
  },
  {
    value: "diagnosis",
    label: "AC Diagnosis",
  },
  {
    value: "spare-parts",
    label: "Spare Parts",
  },
  {
    value: "commercial",
    label:
      "Commercial AC Service",
  },
];

const initialForm = {
  name: "",
  phone: "",
  email: "",

  serviceType:
    "maintenance",

  acType: "",
  brand: "",
  units: 1,

  description: "",

  preferredDate: "",
  preferredTime: "",

  location: "",
  landmark: "",

  notes: "",
};

export default function BookService() {
  const {
    settings,
  } = useBusinessSettings();

  const [
    form,
    setForm,
  ] = useState(
    initialForm
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completedBooking,
    setCompletedBooking,
  ] = useState(null);

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim() ||
        !form.phone.trim()
      ) {
        setError(
          "Please enter your name and phone number."
        );

        return;
      }

      if (
        !form.serviceType
      ) {
        setError(
          "Please select a service."
        );

        return;
      }

      if (
        !form.description.trim()
      ) {
        setError(
          "Please tell us what service or problem you need help with."
        );

        return;
      }

      if (
        !form.preferredDate ||
        !form.preferredTime
      ) {
        setError(
          "Please select your preferred date and time."
        );

        return;
      }

      if (
        !form.location.trim()
      ) {
        setError(
          "Please enter the service location."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const createBooking =
          bookingService.createServiceBooking ||
          bookingService.createBooking ||
          bookingService.submitServiceBooking;

        if (!createBooking) {
          throw new Error(
            "Service booking function was not found."
          );
        }

        const payload = {
          customer: {
            name:
              form.name.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim(),
          },

          serviceType:
            form.serviceType,

          acType:
            form.acType.trim(),

          brand:
            form.brand.trim(),

          units:
            Math.max(
              Number(
                form.units
              ) || 1,
              1
            ),

          description:
            form.description.trim(),

          preferredDate:
            form.preferredDate,

          preferredTime:
            form.preferredTime,

          location:
            form.location.trim(),

          landmark:
            form.landmark.trim(),

          notes:
            form.notes.trim(),
        };

        const result =
          await createBooking(
            payload
          );

        const booking =
          result?.booking ||
          result?.data?.booking ||
          result;

        setCompletedBooking(
          booking
        );

        setForm(
          initialForm
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to submit your service request. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (completedBooking) {
    return (
      <main className="min-h-[70vh] bg-[#F8FAFC] px-5 py-16 sm:px-6">

        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2
              size={34}
            />
          </div>

          <h1 className="mt-6 text-3xl font-black text-[#0B1F33]">
            Service Request Received
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-500">
            Your service request
            has been submitted.
            R&J AC will review the
            request and contact you.
          </p>

          {completedBooking.bookingNumber && (
            <div className="mt-7 rounded-2xl bg-[#EAF6FF] p-5">

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1687D9]">
                Booking Reference
              </p>

              <p className="mt-2 text-xl font-black text-[#0B1F33]">
                {
                  completedBooking.bookingNumber
                }
              </p>

            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to="/"
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-[#0B1F33]"
            >
              Return Home
            </Link>

            <button
              type="button"
              onClick={() =>
                setCompletedBooking(
                  null
                )
              }
              className="rounded-xl bg-[#1687D9] px-6 py-3 text-sm font-bold text-white"
            >
              Book Another Service
            </button>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="bg-[#F8FAFC]">

      {/* Hero */}
      <section className="bg-[#0B1F33] px-5 py-14 text-white sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"
          >
            <ChevronLeft
              size={17}
            />

            Services
          </Link>

          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#58B7F3]">
            Service Booking
          </p>

          <h1 className="mt-2 max-w-3xl text-4xl font-black sm:text-5xl">
            Request professional
            AC assistance.
          </h1>

          {settings.serviceCoverage && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
              {
                settings.serviceCoverage
              }
            </p>
          )}

        </div>

      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">

        {settings.bookingNote && (
          <div className="mb-7 rounded-2xl border border-[#D8EBFA] bg-[#EAF6FF] p-5">

            <div className="flex items-start gap-3">

              <Wrench
                size={20}
                className="mt-0.5 shrink-0 text-[#1687D9]"
              />

              <div>

                <p className="font-bold text-[#0B1F33]">
                  Before you book
                </p>

                <p className="mt-1 text-sm leading-6 text-[#36536B]">
                  {
                    settings.bookingNote
                  }
                </p>

              </div>

            </div>

          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >

          {/* Customer Details */}
          <FormSection
            title="Your Information"
            description="Tell us how we can contact you."
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Full Name"
                required
              >
                <input
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={
                    inputClass
                  }
                />
              </Field>

              <Field
                label="Phone"
                required
              >
                <input
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={
                    inputClass
                  }
                />
              </Field>

              <div className="sm:col-span-2">

                <Field label="Email">

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    className={
                      inputClass
                    }
                  />

                </Field>

              </div>

            </div>

          </FormSection>

          {/* Service */}
          <FormSection
            title="Service Details"
            description="Tell us what type of assistance you need."
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Service Type"
                required
              >
                <select
                  name="serviceType"
                  value={
                    form.serviceType
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={
                    inputClass
                  }
                >
                  {serviceTypes.map(
                    (service) => (
                      <option
                        key={
                          service.value
                        }
                        value={
                          service.value
                        }
                      >
                        {
                          service.label
                        }
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="AC Type">

                <input
                  name="acType"
                  value={
                    form.acType
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Split, Window, Cassette"
                  className={
                    inputClass
                  }
                />

              </Field>

              <Field label="Brand">

                <input
                  name="brand"
                  value={
                    form.brand
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Midea, Samsung"
                  className={
                    inputClass
                  }
                />

              </Field>

              <Field
                label="Number of Units"
                required
              >
                <input
                  type="number"
                  min="1"
                  name="units"
                  value={
                    form.units
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={
                    inputClass
                  }
                />
              </Field>

              <div className="sm:col-span-2">

                <Field
                  label="Describe the Service or Problem"
                  required
                >
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    required
                    rows="5"
                    placeholder="Tell us what is happening with the AC or what service you need..."
                    className={
                      inputClass
                    }
                  />
                </Field>

              </div>

            </div>

          </FormSection>

          {/* Schedule */}
          <FormSection
            title="Preferred Schedule"
            description="Tell us when you would prefer the service."
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Preferred Date"
                required
              >

                <div className="relative">

                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    name="preferredDate"
                    value={
                      form.preferredDate
                    }
                    onChange={
                      handleChange
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split(
                          "T"
                        )[0]
                    }
                    required
                    className={`${inputClass} pl-11`}
                  />

                </div>

              </Field>

              <Field
                label="Preferred Time"
                required
              >

                <div className="relative">

                  <Clock3
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    name="preferredTime"
                    value={
                      form.preferredTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={`${inputClass} pl-11`}
                  />

                </div>

              </Field>

            </div>

          </FormSection>

          {/* Location */}
          <FormSection
            title="Service Location"
            description="Where should our team provide the service?"
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Location / Address"
                required
              >

                <div className="relative">

                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className={`${inputClass} pl-11`}
                  />

                </div>

              </Field>

              <Field label="Landmark">

                <input
                  name="landmark"
                  value={
                    form.landmark
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional landmark"
                  className={
                    inputClass
                  }
                />

              </Field>

            </div>

          </FormSection>

          <FormSection
            title="Additional Notes"
            description="Anything else our team should know?"
          >

            <textarea
              name="notes"
              value={
                form.notes
              }
              onChange={
                handleChange
              }
              rows="4"
              placeholder="Optional additional information..."
              className={
                inputClass
              }
            />

          </FormSection>

          <button
            type="submit"
            disabled={
              submitting
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wrench size={19} />

            {submitting
              ? "Submitting Request..."
              : "Submit Service Request"}
          </button>

        </form>

      </section>

    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10";

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="border-b border-gray-100 pb-5">

        <h2 className="text-lg font-black text-[#0B1F33]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}

      </div>

      <div className="pt-6">
        {children}
      </div>

    </section>
  );
}

function Field({
  label,
  required,
  children,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-[#0B1F33]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </span>

      {children}

    </label>
  );
}