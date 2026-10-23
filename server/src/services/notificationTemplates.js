import { validEmail } from "./emailConfiguration.js";
const messages = {
  "order.pending": [
    "Order received",
    "We received your order. It is pending review, and delivery or collection has not been confirmed.",
  ],
  "order.confirmed": [
    "Order confirmed",
    "Your order has been confirmed. Our team will contact you about the agreed fulfilment arrangements.",
  ],
  "order.ready": [
    "Ready for pickup",
    "Your order is ready for pickup. Please contact our team to arrange collection.",
  ],
  "order.out-for-delivery": [
    "Order out for delivery",
    "Your order has been dispatched for delivery. Contact our team if you need assistance.",
  ],
  "order.delivered": [
    "Order delivered",
    "Your order has been marked delivered. Thank you for choosing us. Please contact us if anything needs attention.",
  ],
  "order.cancelled": [
    "Order cancelled",
    "Your order has been cancelled. Contact our team if you need help with a new request.",
  ],
  "booking.pending": [
    "Service request received",
    "We received your service request. Your preferred date is not a confirmed appointment. Our team will contact you to agree availability, scope and charges.",
  ],
  "booking.confirmed": [
    "Service request confirmed",
    "Our team has confirmed your service request. Please use the visit arrangements agreed directly with our team.",
  ],
  "booking.technician-assigned": [
    "Service staff assigned",
    "A member of our service team has been assigned to your request. Contact us to confirm visit arrangements.",
  ],
  "booking.in-progress": [
    "Service in progress",
    "Work on your service request is in progress. Contact our team if you have any questions.",
  ],
  "booking.completed": [
    "Service completed",
    "Your service request has been marked completed. Please contact us if you need further assistance.",
  ],
  "booking.cancelled": [
    "Service request cancelled",
    "Your service request has been cancelled. Contact our team if you would like to discuss another visit.",
  ],
};
export const notificationTemplates = Object.keys(messages);
export const escapeEmailHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderNotification(template, reference, settings) {
  if (!messages[template]) throw new Error("Unknown notification template.");
  const [title, message] = messages[template];
  const name = settings.businessName || "R&J AC";
  const nextStep = template.endsWith(".pending")
    ? "Keep this reference. Our team will contact you after reviewing your request."
    : template === "order.ready"
      ? "Contact us to agree a collection time and bring your order reference."
      : "Please quote your reference when contacting our team for assistance.";
  let whatsapp = String(settings.whatsapp || "").replace(/\D/g, "");
  if (/^0\d{9}$/.test(whatsapp)) whatsapp = `233${whatsapp.slice(1)}`;
  const whatsappUrl = /^\d{8,15}$/.test(whatsapp)
    ? `https://wa.me/${whatsapp}`
    : "";
  const contacts = [
    settings.primaryPhone && `Telephone: ${settings.primaryPhone}`,
    settings.email && `Email: ${settings.email}`,
    whatsappUrl && `WhatsApp: ${whatsappUrl}`,
    [settings.address, settings.city, settings.region]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const esc = escapeEmailHtml;
  const contactHtml = contacts
    .map(
      (value) =>
        `<p style="margin:8px 0;overflow-wrap:anywhere">${esc(value)}</p>`,
    )
    .join("");
  const links = [
    settings.primaryPhone &&
      `<a href="tel:${esc(String(settings.primaryPhone).replace(/[^+\d]/g, ""))}" style="color:#126ba9">Call our team</a>`,
    validEmail(settings.email) &&
      `<a href="mailto:${esc(settings.email)}" style="color:#126ba9">Email our team</a>`,
    whatsappUrl &&
      `<a href="${whatsappUrl}" style="color:#126ba9">WhatsApp</a>`,
  ]
    .filter(Boolean)
    .join(" &nbsp; · &nbsp; ");
  return {
    reference,
    subject: `${name} - ${title} - ${reference}`.replace(/[\r\n]/g, " "),
    text: `${name}\n${title}\nReference: ${reference}\n\n${message}\n\n${nextStep}\n\n${contacts.join("\n")}\n\nR&J AC · Products, service & support\nThis is an update about your order or service request.`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>@media(max-width:600px){.content{padding:24px 18px!important}.heading{font-size:25px!important}}</style></head><body style="margin:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#0b1f33"><div style="display:none;max-height:0;overflow:hidden">${esc(title)} · ${esc(reference)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dfe6ed;border-radius:12px"><tr><td style="background:#0b1f33;padding:28px;color:white;border-radius:12px 12px 0 0"><p style="font-size:24px;font-weight:bold;margin:0">R&amp;J AC</p><p style="font-size:13px;line-height:1.6;margin:8px 0 0">${esc(name)}</p></td></tr><tr><td class="content" style="padding:36px"><p style="color:#126ba9;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${template.startsWith("order.") ? "Your order" : "Your service request"}</p><h1 class="heading" style="font-size:30px;line-height:1.2;margin:14px 0 24px">${esc(title)}</h1><p style="background:#eaf6ff;padding:16px;border-radius:6px;font-weight:bold;overflow-wrap:anywhere">Reference: ${esc(reference)}</p><p style="font-size:16px;line-height:1.8">${esc(message)}</p><p style="font-size:15px;line-height:1.8">${esc(nextStep)}</p><hr style="border:0;border-top:1px solid #dfe6ed;margin:28px 0"><h2 style="font-size:18px">We're here to help</h2><div style="font-size:14px;line-height:1.6;color:#526575">${contactHtml}</div><p style="font-size:14px;line-height:2">${links}</p></td></tr><tr><td style="padding:22px;background:#f7fafc;border-radius:0 0 12px 12px;font-size:12px;line-height:1.7;color:#526575"><strong>R&amp;J AC · Products, service &amp; support</strong><br>This is an update about your order or service request.</td></tr></table></td></tr></table></body></html>`,
  };
}
