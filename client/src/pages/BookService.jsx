import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Phone,
  Snowflake,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  services,
} from "../data/services";

import {
  createServiceBooking,
} from "../services/serviceBookingService";

const initialForm = {
  name: "",
  phone: "",
  email: "",

  serviceType: "",

  acType: "",
  brand: "",
  units: "1",

  description: "",

  preferredDate: "",
  preferredTime: "",

  location: "",
  landmark: "",

  notes: "",
};

export default function BookService() {
  const [searchParams] =
    useSearchParams();

  const [form, setForm] =
    useState(initialForm);

  const [errors, setErrors] =
    useState({});

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    completedBooking,
    setCompletedBooking,
  ] = useState(null);

  useEffect(() => {
    const serviceFromUrl =
      searchParams.get(
        "service"
      );

    if (
      serviceFromUrl &&
      services.some(
        (service) =>
          service.id ===
          serviceFromUrl
      )
    ) {
      setForm(
        (current) => ({
          ...current,

          serviceType:
            serviceFromUrl,
        })
      );
    }
  }, [searchParams]);

  const handleChange = (
    event
  ) => {
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

    setErrors(
      (current) => ({
        ...current,
        [name]: "",
      })
    );

    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name =
        "Please enter your full name.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone =
        "Please enter your phone number.";
    } else if (
      form.phone.replace(
        /\D/g,
        ""
      ).length < 9
    ) {
      nextErrors.phone =
        "Please enter a valid phone number.";
    }

    if (
      !form.serviceType
    ) {
      nextErrors.serviceType =
        "Please choose a service.";
    }

    if (
      !form.description.trim()
    ) {
      nextErrors.description =
        "Please describe what you need help with.";
    }

    if (
      !form.preferredDate
    ) {
      nextErrors.preferredDate =
        "Please choose your preferred date.";
    }

    if (
      !form.location.trim()
    ) {
      nextErrors.location =
        "Please enter your service location.";
    }

    return nextErrors;
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const nextErrors =
        validate();

      if (
        Object.keys(
          nextErrors
        ).length > 0
      ) {
        setErrors(
          nextErrors
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setSubmitting(true);
        setSubmitError("");

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
            form.acType,

          brand:
            form.brand.trim(),

          units:
            Number(
              form.units
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

        const booking =
          await createServiceBooking(
            payload
          );

        setCompletedBooking(
          booking
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Service booking failed:",
          error
        );

        setSubmitError(
          error.response?.data
            ?.message ||
            "We could not submit your service request. Please try again."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSubmitting(false);
      }
    };

  if (completedBooking) {
    return (
      <BookingSuccess
        booking={
          completedBooking
        }
        onReset={() => {
          setForm(
            initialForm
          );

          setErrors({});
          setSubmitError("");

          setCompletedBooking(
            null
          );
        }}
      />
    );
  }

  return (
    <>
      <section className="bg-[#0B1F33] py-16 text-white sm:py-20">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#74C5FF]">

              <Wrench size={16} />

              Service Booking

            </div>

            <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
              Book an AC Service
            </h1>

            <p className="mt-5 max-w-2xl leading-8 text-white/65">
              Tell us what you need,
              your preferred time and
              where the service is
              required. R&J will review
              your request and follow up.
            </p>

          </div>

        </div>

      </section>

      <section className="bg-[#F7FAFC] py-16 sm:py-20">

        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">

          <form
            onSubmit={
              handleSubmit
            }
            noValidate
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
          >

            {submitError && (
              <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            <FormSectionTitle
              icon={UserRound}
              title="Customer Information"
              description="Tell us how we can contact you."
            />

            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <Field
                label="Full Name"
                required
                error={
                  errors.name
                }
              >
                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your full name"
                  className={inputClasses(
                    errors.name
                  )}
                />
              </Field>

              <Field
                label="Phone Number"
                required
                error={
                  errors.phone
                }
              >
                <input
                  type="tel"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. 024 XXX XXXX"
                  className={inputClasses(
                    errors.phone
                  )}
                />
              </Field>

              <Field
                label="Email Address"
              >
                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="you@example.com"
                  className={inputClasses()}
                />
              </Field>

            </div>

            <Divider />

            <FormSectionTitle
              icon={Snowflake}
              title="AC & Service Details"
              description="Help us understand the service you need."
            />

            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <Field
                label="Service Type"
                required
                error={
                  errors.serviceType
                }
              >
                <select
                  name="serviceType"
                  value={
                    form.serviceType
                  }
                  onChange={
                    handleChange
                  }
                  className={inputClasses(
                    errors.serviceType
                  )}
                >

                  <option value="">
                    Choose a service
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={
                          service.id
                        }
                        value={
                          service.id
                        }
                      >
                        {
                          service.title
                        }
                      </option>
                    )
                  )}

                </select>
              </Field>

              <Field
                label="AC Type"
              >
                <select
                  name="acType"
                  value={
                    form.acType
                  }
                  onChange={
                    handleChange
                  }
                  className={inputClasses()}
                >
                  <option value="">
                    Choose AC type
                  </option>

                  <option value="split">
                    Split AC
                  </option>

                  <option value="standing">
                    Standing AC
                  </option>

                  <option value="cassette">
                    Cassette AC
                  </option>

                  <option value="window">
                    Window AC
                  </option>

                  <option value="commercial">
                    Commercial System
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </Field>

              <Field
                label="AC Brand"
              >
                <input
                  type="text"
                  name="brand"
                  value={
                    form.brand
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Samsung, LG"
                  className={inputClasses()}
                />
              </Field>

              <Field
                label="Number of Units"
              >
                <input
                  type="number"
                  name="units"
                  min="1"
                  value={
                    form.units
                  }
                  onChange={
                    handleChange
                  }
                  className={inputClasses()}
                />
              </Field>

            </div>

            <div className="mt-5">

              <Field
                label="Describe the Problem or Service Needed"
                required
                error={
                  errors.description
                }
              >
                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows="5"
                  placeholder="Example: My AC turns on but is not cooling properly..."
                  className={inputClasses(
                    errors.description
                  )}
                />
              </Field>

            </div>

            <Divider />

            <FormSectionTitle
              icon={CalendarDays}
              title="Schedule"
              description="Choose when you would prefer the service."
            />

            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <Field
                label="Preferred Date"
                required
                error={
                  errors.preferredDate
                }
              >
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
                      .split("T")[0]
                  }
                  className={inputClasses(
                    errors.preferredDate
                  )}
                />
              </Field>

              <Field
                label="Preferred Time"
              >
                <select
                  name="preferredTime"
                  value={
                    form.preferredTime
                  }
                  onChange={
                    handleChange
                  }
                  className={inputClasses()}
                >
                  <option value="">
                    Choose preferred time
                  </option>

                  <option value="morning">
                    Morning
                  </option>

                  <option value="afternoon">
                    Afternoon
                  </option>

                  <option value="evening">
                    Evening
                  </option>
                </select>
              </Field>

            </div>

            <Divider />

            <FormSectionTitle
              icon={MapPin}
              title="Service Location"
              description="Tell us where the technician should come."
            />

            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <Field
                label="Location / Area"
                required
                error={
                  errors.location
                }
              >
                <input
                  type="text"
                  name="location"
                  value={
                    form.location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter town, area or address"
                  className={inputClasses(
                    errors.location
                  )}
                />
              </Field>

              <Field
                label="Nearest Landmark"
              >
                <input
                  type="text"
                  name="landmark"
                  value={
                    form.landmark
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional landmark"
                  className={inputClasses()}
                />
              </Field>

            </div>

            <Divider />

            <FormSectionTitle
              icon={Wrench}
              title="Additional Information"
              description="Anything else R&J should know before reviewing your request."
            />

            <div className="mt-7">

              <Field
                label="Additional Notes"
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
                  placeholder="Anything else we should know?"
                  className={inputClasses()}
                />
              </Field>

            </div>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="mt-8 w-full rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting Request..."
                : "Submit Service Request"}
            </button>

          </form>

          <aside className="space-y-5">

            <div className="rounded-3xl bg-[#0B1F33] p-7 text-white">

              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#74C5FF]">
                Booking Support
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Before you submit
              </h2>

              <div className="mt-6 space-y-4">

                {[
                  "Provide an active phone number.",
                  "Describe the AC issue clearly.",
                  "Choose a suitable service date.",
                  "Enter the correct service location.",
                  "Keep your booking reference after submission.",
                ].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="flex items-start gap-3 text-sm text-white/70"
                    >
                      <CheckCircle2
                        size={17}
                        className="mt-0.5 shrink-0 text-[#74C5FF]"
                      />

                      <span>
                        {item}
                      </span>
                    </div>
                  )
                )}

              </div>

            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-7">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
                <Phone
                  size={20}
                />
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#0B1F33]">
                Need urgent assistance?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                R&J phone and WhatsApp
                details will be connected
                to the company settings
                before production.
              </p>

            </div>

          </aside>

        </div>

      </section>
    </>
  );
}

function FormSectionTitle({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
        <Icon
          size={19}
        />
      </div>

      <div>

        <h2 className="font-bold text-[#0B1F33]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>

      </div>

    </div>
  );
}

function Field({
  label,
  required = false,
  error,
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

      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-500">
          {error}
        </span>
      )}

    </label>
  );
}

function inputClasses(
  error
) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:ring-4 ${
    error
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1687D9] focus:ring-[#1687D9]/10"
  }`;
}

function Divider() {
  return (
    <div className="my-8 border-t border-gray-100" />
  );
}

function BookingSuccess({
  booking,
  onReset,
}) {
  return (
    <section className="flex min-h-[75vh] items-center bg-[#F7FAFC] px-4 py-20">

      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">

          <CheckCircle2
            size={34}
          />

        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
          Request Received
        </p>

        <h1 className="mt-3 text-3xl font-bold text-[#0B1F33]">
          Your service request has
          been submitted successfully.
        </h1>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-600">
          Keep your booking reference.
          R&J AC will use it to identify
          and manage your service request.
        </p>

        <div className="mt-8 rounded-2xl bg-[#EAF6FF] p-6">

          <p className="text-sm font-semibold text-gray-600">
            Service Reference
          </p>

          <p className="mt-2 text-xl font-black text-[#1687D9] sm:text-2xl">
            {
              booking.bookingNumber
            }
          </p>

          <div className="mt-5 border-t border-[#1687D9]/10 pt-5">

            <p className="text-sm text-gray-500">
              Current Status
            </p>

            <p className="mt-1 font-bold capitalize text-[#0B1F33]">
              {
                booking.status
              }
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={
            onReset
          }
          className="mt-8 rounded-xl bg-[#1687D9] px-6 py-3 font-semibold text-white"
        >
          Submit Another Request
        </button>

      </div>

    </section>
  );
}