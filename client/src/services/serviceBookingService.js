import api from "./api";

export async function createServiceBooking(
  bookingData
) {
  const response =
    await api.post(
      "/service-bookings",
      bookingData
    );

  return response.data.booking;
}