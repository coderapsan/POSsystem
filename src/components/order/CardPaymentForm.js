import React, { useState } from "react";

export default function CardPaymentForm({ cardDetails, onCardDetailsChange, className = "" }) {
  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");
    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const formatCVV = (value) => {
    // Only allow digits, max 4
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.length < 13 || cleaned.length > 19) {
      return "Card number must be 13-19 digits";
    }
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0 ? null : "Invalid card number";
  };

  const validateExpiry = (expiry) => {
    if (!expiry || expiry.length !== 5) {
      return "Expiry must be MM/YY format";
    }
    const [month, year] = expiry.split("/");
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10) + 2000;
    
    if (monthNum < 1 || monthNum > 12) {
      return "Invalid month";
    }
    
    const now = new Date();
    const expiryDate = new Date(yearNum, monthNum - 1);
    const currentDate = new Date(now.getFullYear(), now.getMonth());
    
    if (expiryDate < currentDate) {
      return "Card has expired";
    }
    
    return null;
  };

  const validateCVV = (cvv) => {
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      return "CVV must be 3 or 4 digits";
    }
    return null;
  };

  const handleCardNumberChange = (value) => {
    const formatted = formatCardNumber(value);
    onCardDetailsChange("cardNumber", formatted);
    
    if (formatted.replace(/\s/g, "").length >= 13) {
      const error = validateCardNumber(formatted);
      setErrors((prev) => ({ ...prev, cardNumber: error }));
    } else {
      setErrors((prev) => ({ ...prev, cardNumber: null }));
    }
  };

  const handleExpiryChange = (value) => {
    const formatted = formatExpiry(value);
    onCardDetailsChange("expiry", formatted);
    
    if (formatted.length === 5) {
      const error = validateExpiry(formatted);
      setErrors((prev) => ({ ...prev, expiry: error }));
    } else {
      setErrors((prev) => ({ ...prev, expiry: null }));
    }
  };

  const handleCVVChange = (value) => {
    const formatted = formatCVV(value);
    onCardDetailsChange("cvv", formatted);
    
    if (formatted.length >= 3) {
      const error = validateCVV(formatted);
      setErrors((prev) => ({ ...prev, cvv: error }));
    } else {
      setErrors((prev) => ({ ...prev, cvv: null }));
    }
  };

  const handleCardHolderChange = (value) => {
    // Only allow letters and spaces
    const cleaned = value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
    onCardDetailsChange("cardHolder", cleaned);
  };

  const getCardType = (number) => {
    const cleaned = number.replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "Amex";
    if (/^6(?:011|5)/.test(cleaned)) return "Discover";
    return null;
  };

  const cardType = getCardType(cardDetails.cardNumber || "");

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Card Number */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber || ""}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            className={`w-full rounded-lg border ${
              errors.cardNumber ? "border-red-500" : "border-white/10"
            } bg-[#10172d] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none`}
            maxLength={19}
          />
          {cardType && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#f26b30]">
              {cardType}
            </div>
          )}
        </div>
        {errors.cardNumber && (
          <p className="mt-1 text-xs text-red-400">{errors.cardNumber}</p>
        )}
      </div>

      {/* Card Holder Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Cardholder Name
        </label>
        <input
          type="text"
          placeholder="JOHN DOE"
          value={cardDetails.cardHolder || ""}
          onChange={(e) => handleCardHolderChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#10172d] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none"
        />
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Expiry Date
          </label>
          <input
            type="text"
            placeholder="MM/YY"
            value={cardDetails.expiry || ""}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className={`w-full rounded-lg border ${
              errors.expiry ? "border-red-500" : "border-white/10"
            } bg-[#10172d] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none`}
            maxLength={5}
          />
          {errors.expiry && (
            <p className="mt-1 text-xs text-red-400">{errors.expiry}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            CVV
          </label>
          <input
            type="text"
            placeholder="123"
            value={cardDetails.cvv || ""}
            onChange={(e) => handleCVVChange(e.target.value)}
            className={`w-full rounded-lg border ${
              errors.cvv ? "border-red-500" : "border-white/10"
            } bg-[#10172d] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-[#f26b30] focus:outline-none`}
            maxLength={4}
          />
          {errors.cvv && (
            <p className="mt-1 text-xs text-red-400">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <p className="font-semibold">Secure Payment</p>
            <p className="mt-1 text-blue-300/80">
              Your card details are encrypted and securely transmitted. We do not store your CVV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
