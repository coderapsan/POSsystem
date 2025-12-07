import React from "react";
import Link from "next/link";

const links = [
  { href: "/order", label: "POS" },
  { href: "/order-history", label: "Order History" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#121725]/95 backdrop-blur border-b border-[#f26b30]/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-slate-100">
        <div className="flex items-center gap-3">
          <img
            src="/assets/images/the-momos-mark.png"
            alt="The Momos"
            className="h-10 w-auto drop-shadow-md"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#f26b30]">Manager Console</p>
            <p className="text-lg font-semibold">The MoMos Control Hub</p>
          </div>
        </div>
        <div className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-medium transition hover:border-[#f26b30] hover:bg-[#f26b30]/10"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
