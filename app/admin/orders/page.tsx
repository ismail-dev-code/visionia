import { getAdminOrders } from "@/lib/services/admin";
import { formatBDT } from "@/lib/format";
import { OrderPaymentControl } from "@/components/admin/order-payment-control";
import { PaymentManagement } from "@/components/admin/payment-management";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Commerce</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Orders</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method / Payment</th>
                <th className="px-4 py-3 font-medium">COD advance</th>
                <th className="px-4 py-3 font-medium">Due on delivery</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500">No orders yet.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{order.customer}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{order.status}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatBDT(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{order.paymentMethod === "COD" ? "Cash on delivery" : "SSLCommerz"}</div>
                      <div className="text-xs">{order.paymentStatus}</div>
                      <div className="mt-2">
                        <PaymentManagement payments={order.payments} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.advanceAmount > 0
                        ? <>
                            <div>{formatBDT(order.advanceAmount)}</div>
                            <div className="text-xs">
                              {formatBDT(order.advanceAppliedToShipping)} applied to shipping
                            </div>
                            <div className="text-xs">{order.advancePaymentStatus}</div>
                          </>
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.paymentMethod === "COD"
                        ? <>
                            <div>{formatBDT(order.remainingCodAmount)}</div>
                            <div className="text-xs">{order.codRemainderStatus}</div>
                          </>
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderPaymentControl
                        orderId={order.id}
                        paymentMethod={order.paymentMethod}
                        codRemainderStatus={order.codRemainderStatus}
                        advanceAmount={order.advanceAmount}
                        advancePaymentStatus={order.advancePaymentStatus}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
