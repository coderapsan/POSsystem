import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function ReceiptPrint({ order }) {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Receipt-${order.orderId}`,
  });

  return (
    <div className="mt-8 text-center">
      <div ref={printRef} className="p-4 w-64 mx-auto text-sm">
        <h2 className="text-center font-bold text-lg mb-1">
          The MoMos
        </h2>
        <p className="text-center text-xs mb-2">
          {order.timestamp} • {order.orderType}
        </p>
        <p>Order ID: {order.orderId}</p>
        <p>Customer: {order.customer.name}</p>
        <hr className="my-2" />

        {order.items.map((i) => (
          <div key={i.id + i.portion} className="flex justify-between mb-1">
            <span>
              {i.quantity} × {i.name} ({i.portion})
            </span>
            <span>£{(i.price[i.portion] * i.quantity).toFixed(2)}</span>
          </div>
        ))}

        <hr className="my-2" />
        <p className="font-bold text-right">
          Grand Total: £{order.total.toFixed(2)}
        </p>
        <p className="text-xs text-center mt-3">Thank you for ordering!</p>
      </div>

      <button
        onClick={handlePrint}
        className="bg-gray-800 text-white px-4 py-2 rounded mt-3"
      >
        Print 2 Receipts
      </button>
    </div>
  );
}
