export function contactErrors(form, nameKey = "fullName") {
  const errors = {};
  if ((form[nameKey] || "").trim().length < 2)
    errors[nameKey] = "Enter your full name (at least two characters).";
  if (
    !/^\+?[\d\s()-]+$/.test(form.phone) ||
    form.phone.replace(/\D/g, "").length < 9 ||
    form.phone.replace(/\D/g, "").length > 15
  )
    errors.phone = "Enter a valid phone number, for example 020 123 4567.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address or leave this blank.";
  return errors;
}
export function focusFirstError(errors) {
  const field = document.getElementById(Object.keys(errors)[0]);
  field?.focus();
}
