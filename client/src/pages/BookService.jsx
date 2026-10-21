import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { services } from "../data/services";
import { useBusinessSettings } from "../context/BusinessSettingsState";
import {
  createServiceBooking,
  pendingBookingData,
  pendingBookingForm,
} from "../services/serviceBookingService";
import { contactErrors, focusFirstError } from "../utils/formValidation";
import { phoneHref, whatsappHref } from "../utils/businessLinks";
import usePageMeta from "../hooks/usePageMeta";
import {
  Container,
  PageHero,
  Button,
  FormControl,
  FormSection,
  Alert,
} from "../components/ui/Storefront";
const initial = {
  name: "",
  phone: "",
  email: "",
  serviceType: "maintenance",
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
  const [params] = useSearchParams();
  const selected = params.get("service");
  return <BookingForm key={selected || "default"} selected={selected} />;
}
function BookingForm({ selected }) {
  const { settings } = useBusinessSettings();
  const [form, setForm] = useState(() => ({
    ...initial,
    serviceType: services.some((s) => s.id === selected)
      ? selected
      : "maintenance",
    ...pendingBookingForm(),
  }));
  const [pending, setPending] = useState(() => Boolean(pendingBookingData()));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [booking, setBooking] = useState(null);
  const lock = useRef(false);
  usePageMeta(
    booking ? "Service request received" : "Book an AC service",
    "Request installation, repair, maintenance or diagnosis. Choose a preferred time and share your location for review by the R&J team.",
  );
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((old) => ({ ...old, [e.target.name]: "" }));
    setError("");
  };
  const field = (name, label, props = {}) => (
    <FormControl
      name={name}
      label={label}
      value={form[name]}
      error={errors[name]}
      onChange={change}
      {...props}
    />
  );
  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    const found = contactErrors(form, "name");
    if (form.description.trim().length < 5)
      found.description =
        "Describe the issue or work you need (at least five characters).";
    if (!form.preferredDate || form.preferredDate < minDate)
      found.preferredDate = "Choose today or a future date.";
    if (!form.preferredTime)
      found.preferredTime = "Select your preferred time.";
    if (form.location.trim().length < 2)
      found.location = "Enter the service location.";
    if (!Number.isInteger(Number(form.units)) || Number(form.units) < 1)
      found.units = "Enter a whole number of units, at least one.";
    setErrors(pending ? {} : found);
    if (!pending && Object.keys(found).length) {
      setError("Please check the highlighted fields.");
      focusFirstError(found);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await createServiceBooking(
        pendingBookingData() || {
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
          },
          serviceType: form.serviceType,
          acType: form.acType.trim(),
          brand: form.brand.trim(),
          units: Number(form.units),
          description: form.description.trim(),
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          location: form.location.trim(),
          landmark: form.landmark.trim(),
          notes: form.notes.trim(),
        },
      );
      setBooking(result);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (err) {
      setPending(Boolean(pendingBookingData()));
      setError(
        err.response?.data?.message ||
          err.message ||
          "We could not confirm your request. Retry the original request to recover its reference.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const contacts = (
    <div className="mt-5 flex flex-wrap gap-3">
      {settings.primaryPhone && (
        <Button variant="secondary" href={phoneHref(settings.primaryPhone)}>
          <Phone size={16} />
          Call us
        </Button>
      )}
      {settings.whatsapp && (
        <Button
          variant="secondary"
          href={whatsappHref(
            settings.whatsapp,
            booking
              ? `Hello, I am following up on service request ${booking.bookingNumber}.`
              : undefined,
          )}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} />
          WhatsApp
        </Button>
      )}
    </div>
  );
  if (booking)
    return (
      <Container className="section-rj">
        <div className="receipt panel">
          <CheckCircle2 className="mx-auto text-[#1687D9]" size={44} />
          <p className="eyebrow mt-6">Request pending review</p>
          <h1 className="!text-3xl">Service Request Received</h1>
          <p className="reference">{booking.bookingNumber}</p>
          <p className="text-[#637381]">
            Your preferred date is a request, not a confirmed appointment. Our
            team will review the details and contact you to agree the next
            steps.
          </p>
          {contacts}
          <Button className="mt-5" to="/services">
            Explore services
          </Button>
        </div>
      </Container>
    );
  return (
    <>
      <PageHero eyebrow="Book a service" title="Tell us how we can help.">
        Share the details of your system and the work you need. Our team will
        review your request before confirming a visit.
      </PageHero>
      <Container className="section-rj">
        <div className="commerce-layout">
          <form
            noValidate
            onSubmit={submit}
            className="space-y-5"
            aria-label="Service request"
          >
            {error && <Alert error>{error}</Alert>}
            {pending && (
              <Alert>
                Your previous request is awaiting confirmation. Its original
                details are locked. Retry below to recover the same reference
                safely, or contact our team.
              </Alert>
            )}
            <fieldset disabled={busy || pending} className="space-y-5">
              <FormSection number="01" title="Contact">
                <div className="form-grid">
                  {field("name", "Full name *", {
                    autoComplete: "name",
                    required: true,
                  })}
                  {field("phone", "Phone number *", {
                    type: "tel",
                    autoComplete: "tel",
                    hint: "Ghana: 020 123 4567 or +233 20 123 4567.",
                    required: true,
                  })}
                  {field("email", "Email (optional)", {
                    type: "email",
                    autoComplete: "email",
                  })}
                </div>
              </FormSection>
              <FormSection number="02" title="Service & AC details">
                <div className="form-grid">
                  {field("serviceType", "Service needed *", {
                    options: services.map((s) => ({
                      value: s.id,
                      label: s.title,
                    })),
                  })}
                  {field("acType", "AC type (if known)", {
                    placeholder: "For example, wall-mounted split AC",
                  })}
                  {field("brand", "Brand (if known)")}
                  {field("units", "Number of units *", {
                    type: "number",
                    min: 1,
                    step: 1,
                    required: true,
                  })}
                </div>
                <p className="mt-5 text-sm text-[#637381]">
                  {
                    services.find((s) => s.id === form.serviceType)
                      ?.shortDescription
                  }
                </p>
              </FormSection>
              <FormSection number="03" title="Problem / requirements">
                {field("description", "What do you need help with? *", {
                  multiline: true,
                  required: true,
                  hint: "Include symptoms, when they started, or the work you would like done.",
                })}
              </FormSection>
              <FormSection number="04" title="Preferred date & time">
                <div className="form-grid">
                  {field("preferredDate", "Preferred date *", {
                    type: "date",
                    min: minDate,
                    required: true,
                  })}
                  {field("preferredTime", "Preferred time *", {
                    options: [
                      { value: "", label: "Select a time" },
                      { value: "morning", label: "Morning" },
                      { value: "afternoon", label: "Afternoon" },
                      { value: "evening", label: "Evening" },
                    ],
                    required: true,
                  })}
                </div>
                <p className="mt-4 text-sm text-[#637381]">
                  {settings.bookingNote}
                </p>
              </FormSection>
              <FormSection number="05" title="Location">
                <div className="form-grid">
                  {field("location", "Service address / area *", {
                    required: true,
                    autoComplete: "street-address",
                  })}
                  {field("landmark", "Landmark (optional)")}
                </div>
              </FormSection>
              <FormSection number="06" title="Additional notes & review">
                {field("notes", "Anything else we should know?", {
                  multiline: true,
                })}
                <p className="mt-5 text-sm text-[#637381]">
                  Check your phone number, location and preferred date before
                  sending.
                </p>
              </FormSection>
            </fieldset>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy
                ? "Submitting Request..."
                : pending
                  ? "Retry Original Request"
                  : "Submit Service Request"}
            </Button>
          </form>
          <aside className="order-summary panel">
            <p className="eyebrow">Your service request</p>
            <h2 className="!text-2xl">
              {services.find((s) => s.id === form.serviceType)?.title}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#637381]">
              {settings.serviceCoverage}
            </p>
            <div className="my-6 border-y border-[#E4E9EE] py-5">
              <h3 className="!text-base">What happens next?</h3>
              <p className="mt-3 text-sm leading-7 text-[#637381]">
                You receive an RJ-SVC reference. Our team reviews the request
                and contacts you about availability, scope and charges.
              </p>
            </div>
            <h3 className="!text-base">Prefer to talk?</h3>
            {contacts}
          </aside>
        </div>
      </Container>
    </>
  );
}
