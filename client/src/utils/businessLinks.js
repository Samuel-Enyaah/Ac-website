export function phoneHref(
  phone = ""
) {
  const cleaned =
    String(phone).replace(
      /[^\d+]/g,
      ""
    );

  return cleaned
    ? `tel:${cleaned}`
    : undefined;
}

export function emailHref(
  email = ""
) {
  return email
    ? `mailto:${email}`
    : undefined;
}

export function whatsappHref(
  phone = "",
  message =
    "Hello R&J AC, I would like assistance with an air-conditioning product or service."
) {
  let digits =
    String(phone).replace(
      /\D/g,
      ""
    );

  if (
    digits.length === 10 &&
    digits.startsWith("0")
  ) {
    digits =
      `233${digits.slice(
        1
      )}`;
  }

  if (
    digits.startsWith(
      "2330"
    )
  ) {
    digits =
      `233${digits.slice(
        4
      )}`;
  }

  if (!digits) {
    return undefined;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    message
  )}`;
}

export function fullAddress(
  settings
) {
  return [
    settings.address,
    settings.city,
    settings.region,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
}
