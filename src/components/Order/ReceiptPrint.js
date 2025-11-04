import React from 'react';

export default function ReceiptPrint({ order }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-bold mb-2">Order #{order.orderId}</h3>
      <p>{new Date(order.timestamp).toLocaleString()}</p>
      <p>Type: {order.orderType.toUpperCase()}</p>
      <p>Customer: {order.customer.name}</p>
      {order.orderType === 'delivery' && <p>Address: {order.customer.address}</p>}
      <hr className="my-2" />
      {order.items.map((i) => (
        <div key={i.id} className="flex justify-between text-sm">
          <span>{i.name} x{i.quantity}</span>
          <span>£{(i.price.large * i.quantity).toFixed(2)}</span>
        </div>
      ))}
      <hr className="my-2" />
      <div className="font-bold text-right">Total: £{order.total.toFixed(2)}</div>

      <button
        onClick={handlePrint}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Print 2 Receipts
      </button>
    </div>
  );
}
