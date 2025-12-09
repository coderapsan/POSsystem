import React from "react";

export default function OrderHeader({ subtleButtonClass }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-[#f26b30]">Live POS</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          The MoMos POS System
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage dine-in, takeaway, and delivery tickets with a branded control hub built for speed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={subtleButtonClass}
          onClick={() => (window.location.href = "/order-history")}
        >
          View Order History
        </button>
        <button
          className={subtleButtonClass}
          onClick={() => (window.location.href = "/admin")}
        >
          Admin Console
        </button>
      </div>
    </header>
  );
}
