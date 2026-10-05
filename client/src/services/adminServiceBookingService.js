import api from "./api";

export async function getAdminServiceBookings(
  params = {}
) {
  const response =
    await api.get(
      "/admin/bookings",
      {
        params,
      }
    );

  return response.data;
}

export async function getAdminServiceBooking(
  bookingId
) {
  const response =
    await api.get(
      `/admin/bookings/${bookingId}`
    );

  return response.data.booking;
}

export async function updateAdminServiceBooking(
  bookingId,
  updates
) {
  const response =
    await api.patch(
      `/admin/bookings/${bookingId}`,
      updates
    );

  return response.data.booking;
}