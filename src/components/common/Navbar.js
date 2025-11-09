import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-orange-700 text-white px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      <div className="font-bold text-xl tracking-wide">The MoMos POS</div>
      <div className="flex gap-4">
        <Link href="/order">
          <span className="hover:bg-orange-800 px-3 py-2 rounded transition cursor-pointer">Order</span>
        </Link>
        <Link href="/order-history">
          <span className="hover:bg-orange-800 px-3 py-2 rounded transition cursor-pointer">Order History</span>
        </Link>
        <Link href="/admin">
          <span className="hover:bg-orange-800 px-3 py-2 rounded transition cursor-pointer">Admin</span>
        </Link>
      </div>
    </nav>
  );
}
