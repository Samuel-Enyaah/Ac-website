import {
  useEffect,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Share2,
} from "lucide-react";

import {
  getAdminSettings,
  updateAdminSettings,
} from "../../services/adminSettingsService";

const initialSettings = {
  businessName: "R&J AC",

  legalName:
    "R&J AC ACCESSARIES COM. LTD",

  slogan:
    "Cooling Solutions You Can Rely On.",

  primaryPhone: "",
  secondaryPhone: "",
  whatsapp: "",
  email: "",

  address: "",
  city: "",
  region: "",
  country: "Ghana",

  mapUrl: "",
  logoUrl: "",

  deliveryNote:
    "Delivery arrangements and charges are confirmed before dispatch.",

  serviceCoverage:
    "Residential and commercial air-conditioning services.",

  bookingNote:
    "Service requests are reviewed before confirmation.",

  openingHours: {
    monday:
      "8:00 AM - 5:00 PM",

    tuesday:
      "8:00 AM - 5:00 PM",

    wednesday:
      "8:00 AM - 5:00 PM",

    thursday:
      "8:00 AM - 5:00 PM",

    friday:
      "8:00 AM - 5:00 PM",

    saturday:
      "9:00 AM - 3:00 PM",

    sunday: "Closed",
  },

  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    x: "",
  },
};

export default function AdminSettings() {
  const [
    form,
    setForm,
  ] = useState(
    initialSettings
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const loadSettings =
    async () => {
      try {
        setLoading(true);
        setError("");

        const settings =
          await getAdminSettings();

        setForm({
          ...initialSettings,
          ...settings,

          openingHours: {
            ...initialSettings.openingHours,
            ...settings.openingHours,
          },

          socialLinks: {
            ...initialSettings.socialLinks,
            ...settings.socialLinks,
          },
        });
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data
            ?.message ||
            "Unable to load business settings."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadSettings();
  }, []);

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

      setSuccess("");
      setError("");
    };

  const handleOpeningHours =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          openingHours: {
            ...current.openingHours,
            [name]: value,
          },
        })
      );

      setSuccess("");
      setError("");
    };

  const handleSocialLink =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          socialLinks: {
            ...current.socialLinks,
            [name]: value,
          },
        })
      );

      setSuccess("");
      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const updated =
          await updateAdminSettings({
            businessName:
              form.businessName.trim(),

            legalName:
              form.legalName.trim(),

            slogan:
              form.slogan.trim(),

            primaryPhone:
              form.primaryPhone.trim(),

            secondaryPhone:
              form.secondaryPhone.trim(),

            whatsapp:
              form.whatsapp.trim(),

            email:
              form.email.trim(),

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            region:
              form.region.trim(),

            country:
              form.country.trim(),

            mapUrl:
              form.mapUrl.trim(),

            logoUrl:
              form.logoUrl.trim(),

            deliveryNote:
              form.deliveryNote.trim(),

            serviceCoverage:
              form.serviceCoverage.trim(),

            bookingNote:
              form.bookingNote.trim(),

            openingHours:
              form.openingHours,

            socialLinks:
              form.socialLinks,
          });

        setForm({
          ...initialSettings,
          ...updated,

          openingHours: {
            ...initialSettings.openingHours,
            ...updated.openingHours,
          },

          socialLinks: {
            ...initialSettings.socialLinks,
            ...updated.socialLinks,
          },
        });

        setSuccess(
          "Business settings saved successfully."
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
            "Unable to save business settings."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

        <RefreshCw
          size={28}
          className="mx-auto animate-spin text-[#1687D9]"
        />

        <p className="mt-4 text-sm text-gray-500">
          Loading business settings...
        </p>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1687D9]">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1F33]">
            Business Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage the company
            information used across
            R&J AC's website and
            business operations.
          </p>

        </div>

        <button
          type="button"
          onClick={
            loadSettings
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B1F33]"
        >
          <RefreshCw
            size={17}
          />

          Reload
        </button>

      </section>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-8 space-y-6"
      >

        <SettingsCard
          icon={Building2}
          title="Business Identity"
          description="Core company information."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field
              label="Business Name"
              required
            >
              <input
                name="businessName"
                value={
                  form.businessName
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
              label="Legal Business Name"
              required
            >
              <input
                name="legalName"
                value={
                  form.legalName
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

          </div>

          <div className="mt-5">

            <Field label="Business Slogan">

              <input
                name="slogan"
                value={
                  form.slogan
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

          <div className="mt-5">

            <Field label="Logo URL">

              <input
                name="logoUrl"
                value={
                  form.logoUrl
                }
                onChange={
                  handleChange
                }
                placeholder="https://..."
                className={
                  inputClass
                }
              />

            </Field>

            <p className="mt-2 text-xs text-gray-400">
              We will replace this
              with direct image upload
              when Cloudinary is
              connected.
            </p>

          </div>

        </SettingsCard>

        <SettingsCard
          icon={Phone}
          title="Contact Information"
          description="Phone, WhatsApp and email details."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field label="Primary Phone">

              <input
                name="primaryPhone"
                value={
                  form.primaryPhone
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. 024 000 0000"
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="Secondary Phone">

              <input
                name="secondaryPhone"
                value={
                  form.secondaryPhone
                }
                onChange={
                  handleChange
                }
                placeholder="Optional"
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="WhatsApp Number">

              <input
                name="whatsapp"
                value={
                  form.whatsapp
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. 233240000000"
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="Business Email">

              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="info@example.com"
                className={
                  inputClass
                }
              />

            </Field>

          </div>

        </SettingsCard>

        <SettingsCard
          icon={MapPin}
          title="Business Location"
          description="Address and geographical information."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field label="Address">

              <input
                name="address"
                value={
                  form.address
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="City / Town">

              <input
                name="city"
                value={
                  form.city
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="Region">

              <input
                name="region"
                value={
                  form.region
                }
                onChange={
                  handleChange
                }
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="Country">

              <input
                name="country"
                value={
                  form.country
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

          <div className="mt-5">

            <Field label="Google Maps Link">

              <input
                name="mapUrl"
                value={
                  form.mapUrl
                }
                onChange={
                  handleChange
                }
                placeholder="https://..."
                className={
                  inputClass
                }
              />

            </Field>

          </div>

        </SettingsCard>

        <SettingsCard
          icon={Clock3}
          title="Opening Hours"
          description="Set the company's normal operating hours."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            {Object.entries(
              form.openingHours
            ).map(
              ([
                day,
                value,
              ]) => (
                <Field
                  key={day}
                  label={
                    day
                      .charAt(0)
                      .toUpperCase() +
                    day.slice(1)
                  }
                >
                  <input
                    name={day}
                    value={
                      value
                    }
                    onChange={
                      handleOpeningHours
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>
              )
            )}

          </div>

        </SettingsCard>

        <SettingsCard
          icon={Share2}
          title="Social Media"
          description="Links to R&J AC social accounts."
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field label="Facebook">

              <input
                name="facebook"
                value={
                  form.socialLinks
                    .facebook
                }
                onChange={
                  handleSocialLink
                }
                placeholder="https://facebook.com/..."
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="Instagram">

              <input
                name="instagram"
                value={
                  form.socialLinks
                    .instagram
                }
                onChange={
                  handleSocialLink
                }
                placeholder="https://instagram.com/..."
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="TikTok">

              <input
                name="tiktok"
                value={
                  form.socialLinks
                    .tiktok
                }
                onChange={
                  handleSocialLink
                }
                placeholder="https://tiktok.com/@..."
                className={
                  inputClass
                }
              />

            </Field>

            <Field label="X / Twitter">

              <input
                name="x"
                value={
                  form.socialLinks
                    .x
                }
                onChange={
                  handleSocialLink
                }
                placeholder="https://x.com/..."
                className={
                  inputClass
                }
              />

            </Field>

          </div>

        </SettingsCard>

        <SettingsCard
          icon={MessageCircle}
          title="Customer Information"
          description="Messages shown to customers during ordering and service booking."
        >

          <Field label="Delivery Information">

            <textarea
              name="deliveryNote"
              value={
                form.deliveryNote
              }
              onChange={
                handleChange
              }
              rows="3"
              className={
                inputClass
              }
            />

          </Field>

          <div className="mt-5">

            <Field label="Service Coverage">

              <textarea
                name="serviceCoverage"
                value={
                  form.serviceCoverage
                }
                onChange={
                  handleChange
                }
                rows="3"
                className={
                  inputClass
                }
              />

            </Field>

          </div>

          <div className="mt-5">

            <Field label="Booking Information">

              <textarea
                name="bookingNote"
                value={
                  form.bookingNote
                }
                onChange={
                  handleChange
                }
                rows="3"
                className={
                  inputClass
                }
              />

            </Field>

          </div>

        </SettingsCard>

        <button
          type="submit"
          disabled={
            saving
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1687D9] px-6 py-4 font-bold text-white transition hover:bg-[#1176BF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />

          {saving
            ? "Saving Settings..."
            : "Save Business Settings"}
        </button>

      </form>

    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17212B] outline-none transition placeholder:text-gray-400 focus:border-[#1687D9] focus:ring-4 focus:ring-[#1687D9]/10";

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex items-start gap-3 border-b border-gray-100 pb-5">

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#1687D9]">
            <Icon size={19} />
          </div>
        )}

        <div>

          <h2 className="font-bold text-[#0B1F33]">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>

        </div>

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