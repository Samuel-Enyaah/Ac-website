import { useParams } from "react-router-dom";
import OperationDetails from "../../components/admin/OperationDetails";
export default function AdminOrderDetails() {
  const { orderId } = useParams();
  return <OperationDetails key={orderId} type="order" id={orderId} />;
}
