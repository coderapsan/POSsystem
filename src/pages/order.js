// pages/order.js
import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { saveOrder } from '../lib/orders';
import ReceiptPrint from '../components/Order/ReceiptPrint';
import menuData from '../data/momos.json';

export default function OrderPage() {
  const [orderType, setOrderType] = useState('collection');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);

  const addToCart = (item) => {
    const exists = cart.find(i => i.id === item.id);
    if (exists) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (item) => {
    const exists = cart.find(i => i.id === item.id);
    if (exists.quantity === 1) {
      setCart(cart.filter(i => i.id !== item.id));
    } else {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const handleSubmitOrder = () => {
    const orderData = {
      orderId: `ORD-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`,
      timestamp: new Date().toISOString(),
      orderType,
      customer,
      items: cart,
      total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: 'completed'
    };

    saveOrder(orderData);
    setOrder(orderData);
    setCart([]);
  };

  return (
    <Layout>
      <div className="mt-28 p-6">
        <h1 className="text-2xl font-bold mb-4">Take New Order</h1>

        {/* Order Type */}
        <div className="flex gap-4 mb-4">
          {['delivery', 'collection'].map(type => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-4 py-2 rounded-lg ${orderType === type ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Customer Name"
            value={customer.name}
            onChange={e => setCustomer({ ...customer, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={customer.phone}
            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
            className="border p-2 rounded"
          />
          {orderType === 'delivery' && (
            <input
              type="text"
              placeholder="Address"
              value={customer.address}
              onChange={e => setCustomer({ ...customer, address: e.target.value })}
              className="border p-2 rounded"
            />
          )}
        </div>

        {/* Menu Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuData.Starters.map(item => (
            <div key={item.id} className="p-4 border rounded-lg hover:shadow-lg">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-gray-600">£{item.price.large}</p>
              <button
                onClick={() => addToCart(item)}
                className="mt-2 bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Cart Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b py-2">
              <div>{item.name} x {item.quantity}</div>
              <div className="flex gap-2">
                <button onClick={() => removeFromCart(item)}>-</button>
                <button onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
          <div className="mt-4 font-bold">
            Total: £{cart.reduce((sum, i) => sum + i.price.large * i.quantity, 0).toFixed(2)}
          </div>

          <button
            onClick={handleSubmitOrder}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Complete Order & Print
          </button>
        </div>

        {/* Receipt Print */}
        {order && <ReceiptPrint order={order} />}
      </div>
    </Layout>
  );
}
