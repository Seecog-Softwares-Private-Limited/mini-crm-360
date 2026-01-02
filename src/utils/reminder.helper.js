export function buildReminder(customer, type, date, today, limit) {
  const eventDate = new Date(date);
  eventDate.setFullYear(today.getFullYear());

  if (eventDate < today) {
    eventDate.setFullYear(today.getFullYear() + 1);
  }

  const daysUntil = Math.floor(
    (eventDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0 || daysUntil > limit) return null;

  return {
    customerId: customer.id,
    customerName: customer.name,
    type,
    date: eventDate,
    daysUntil,
    isToday: daysUntil === 0,

    // UI uses these
    phoneE164: customer.whatsappE164 || customer.phoneE164,
    email: customer.email
  };
}
