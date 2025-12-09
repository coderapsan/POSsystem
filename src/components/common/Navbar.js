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
      {/* Demo Badge */}
      <div className="bg-yellow-400 text-slate-900 text-center py-1 text-xs font-bold tracking-widest">
        🚀 DEMO VERSION - Product Still Building
      </div>

      <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 py-3 ${palette.text}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/assets/images/the-momos-mark.png"
            alt="The Momos"
            className="h-8 sm:h-10 w-auto drop-shadow-md"
          />
          <div className="hidden sm:block">
            <p className={`text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] ${palette.accent}`}>
              Manager Console
            </p>
            <p className="text-base sm:text-lg font-semibold">The MoMos</p>
          </div>
          <div className="sm:hidden">
            <p className={`text-xs ${palette.accent}`}>MoMos</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border border-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${palette.link}`}
            >
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden">{link.label.split(" ")[0]}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLock}
            className={`rounded-full border px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${palette.lock}`}
          >
            <span className="hidden sm:inline">Lock</span>
            <span className="sm:hidden">🔒</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
