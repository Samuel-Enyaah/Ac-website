import { useParams } from "react-router-dom";
import OperationDetails from "../../components/admin/OperationDetails";
export default function AdminBookingDetails() {
  const { bookingId } = useParams();
  return <OperationDetails key={bookingId} type="booking" id={bookingId} />;
}
