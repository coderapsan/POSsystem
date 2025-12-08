import React, { useEffect, useState } from "react";

const STAFF_PIN = process.env.NEXT_PUBLIC_STAFF_PIN || "momos-staff";
const STORAGE_KEY = "momos-staff-access";

export default function StaffGate({ children }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = window.sessionStorage.getItem(STORAGE_KEY);
    if (flag === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitized = code.trim();
    if (!sanitized) {
      setError("Enter the latest staff passcode.");
      return;
    }
    if (sanitized === STAFF_PIN.trim()) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, "true");
      }
      setIsUnlocked(true);
      setError("");
      setCode("");
      return;
    }
    setError("Incorrect passcode. Try again or speak with a manager.");
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
          <div className="rounded-3xl border border-white/10 bg-[#101828] p-7 shadow-2xl shadow-black/50">
            <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Restricted</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Staff Access Required</h1>
            <p className="mt-2 text-sm text-slate-400">
              This area is for The MoMos team. Enter the staff passcode to continue.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter staff passcode"
                className="w-full rounded-lg border border-white/15 bg-[#0f192d] px-4 py-3 text-sm text-white placeholder:text-slate-500 caret-[#f26b30] focus:border-[#f26b30] focus:outline-none focus:ring-2 focus:ring-[#f26b30]/40"
              />
              {error && <p className="text-xs font-medium text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-full bg-[#f26b30] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
              >
                Unlock
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              Need help? Contact the duty manager for the latest access code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
