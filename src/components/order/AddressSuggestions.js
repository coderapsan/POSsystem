import React, { useRef, useEffect } from "react";

export default function AddressSuggestions({ 
  addresses, 
  isVisible, 
  onSelect, 
  selectedIndex,
  onKeyboardNavigate,
  source
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isVisible || !addresses || addresses.length === 0) {
    return null;
  }

  // Determine data source label and styling
  const sourceInfo = {
    'getaddress': { 
      label: '✓ LIVE DATA (GetAddress.io)', 
      color: 'bg-green-600 text-white',
      hint: 'Royal Mail verified addresses'
    },
    'ideal': { 
      label: '✓ LIVE DATA (Ideal Postcodes)', 
      color: 'bg-green-600 text-white',
      hint: 'Official UK addresses'
    },
    'demo': { 
      label: '⚠ DEMO MODE', 
      color: 'bg-amber-500 text-white',
      hint: 'Setup API key for real addresses (see SETUP_ADDRESS_API.md)'
    },
    'postcodes.io': { 
      label: '⚠ AREA ONLY', 
      color: 'bg-orange-500 text-white',
      hint: 'Limited data - setup GetAddress.io for street addresses'
    }
  };

  const currentSource = sourceInfo[source] || sourceInfo['demo'];

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border-2 border-blue-300 bg-white shadow-2xl">
      <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">
              📍 Select Address ({addresses.length} found)
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${currentSource.color}`}>
              {currentSource.label}
            </span>
          </div>
          <span className="text-blue-600 font-semibold">↑↓ Enter</span>
        </div>
        {source === 'demo' && (
          <div className="mt-1 text-[10px] text-amber-700 font-medium">
            {currentSource.hint}
          </div>
        )}
      </div>
      <ul ref={listRef} className="divide-y divide-slate-100">
        {addresses.map((address, index) => (
          <li
            key={address.id || index}
            onClick={() => onSelect(address)}
            className={`cursor-pointer px-4 py-3 transition-all duration-150 ${
              index === selectedIndex
                ? 'bg-blue-100 border-l-4 border-blue-500'
                : 'hover:bg-blue-50 border-l-4 border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                index === selectedIndex 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold ${
                  index === selectedIndex ? 'text-blue-900' : 'text-slate-900'
                }`}>
                  {address.line1}
                </div>
                {address.line2 && (
                  <div className="text-xs text-slate-600">{address.line2}</div>
                )}
                <div className="mt-0.5 text-xs text-slate-500">
                  {address.town}{address.county ? `, ${address.county}` : ''}
                </div>
              </div>
              {index === selectedIndex && (
                <div className="flex-shrink-0 text-blue-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-center text-[10px] text-slate-600">
        Press <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-600 shadow-sm">↓</kbd> <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-600 shadow-sm">↑</kbd> to navigate • <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-600 shadow-sm">Enter</kbd> to select • <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-blue-600 shadow-sm">Esc</kbd> to close
      </div>
    </div>
  );
}
