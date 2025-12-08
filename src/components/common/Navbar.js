import React from "react";
import Link from "next/link";

export default function Navbar({ scheme = "dark", isHidden = false }) {
  const handleLock = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("momos-staff-access");
      window.location.href = "/";
    }
  };

  const links = [
    { href: "/order", label: "POS" },
    { href: "/order-history", label: "Order History" },
    { href: "/admin", label: "Admin" },
  ];

  const palette =
    scheme === "light"
      ? {
          nav: "bg-white/95 border-slate-200/80 backdrop-blur",
          text: "text-slate-900",
          sub: "text-slate-500",
          accent: "text-[#f26b30]",
          link: "text-slate-700 hover:border-[#f26b30] hover:bg-[#f26b30]/10",
          lock: "border-slate-300 text-slate-700 hover:border-[#f26b30] hover:text-[#f26b30]",
        }
      : {
          nav: "bg-[#121725]/95 border-[#f26b30]/20 backdrop-blur",
          text: "text-slate-100",
          sub: "text-slate-300",
          accent: "text-[#f26b30]",
          link: "text-slate-100 hover:border-[#f26b30] hover:bg-[#f26b30]/10",
          lock: "border-white/10 text-slate-200 hover:border-[#f26b30] hover:text-white",
        };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-transform duration-300 ease-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      } ${palette.nav}`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 py-3 ${palette.text}`}>
        <div className="flex items-center gap-3">
          <img
            src="/assets/images/the-momos-mark.png"
            alt="The Momos"
            className="h-10 w-auto drop-shadow-md"
          />
          <div>
            <p className={`text-sm uppercase tracking-[0.3em] ${palette.accent}`}>
              Manager Console
            </p>
            <p className="text-lg font-semibold">The MoMos Control Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border border-transparent px-4 py-2 text-sm font-medium transition ${palette.link}`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLock}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${palette.lock}`}
          >
            Lock
          </button>
        </div>
      </div>
    </nav>
  );
}
