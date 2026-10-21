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
export function renderNotification(template, reference, settings) {
  if (!messages[template]) throw new Error("Unknown notification template.");
  const [title, message] = messages[template];
  const name = settings.businessName || "R&J AC";
  const contacts = [
    settings.primaryPhone && `Telephone: ${settings.primaryPhone}`,
    settings.email && `Email: ${settings.email}`,
    settings.whatsapp && `WhatsApp: ${settings.whatsapp}`,
    [settings.address, settings.city, settings.region]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  return {
    reference,
    subject: `${name} - ${title} - ${reference}`,
    text: `${name}\n${title}\nReference: ${reference}\n\n${message}\n\n${contacts.join("\n")}`,
  };
}
