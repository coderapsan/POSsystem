import React, { useState, useEffect, useCallback, useRef } from "react";
import CustomerHistory from "./CustomerHistory";
import AddressSuggestions from "./AddressSuggestions";
import CustomerSummaryCard from "./CustomerSummaryCard";
import AddressAutocomplete from "./AddressAutocomplete";

export default function OrderInfoForm({
  orderType,
  onOrderTypeChange,
  customer,
  onCustomerChange,
  inputClass,
}) {
  const [customerHistory, setCustomerHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [phoneDebounceTimer, setPhoneDebounceTimer] = useState(null);
  const [postalDebounceTimer, setPostalDebounceTimer] = useState(null);
  const [isLookingUpPostal, setIsLookingUpPostal] = useState(false);
  
  // Address suggestions state
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [addressSource, setAddressSource] = useState('demo'); // Track data source
  const addressInputRef = useRef(null);
  const postalInputRef = useRef(null);
  
  // Google Maps integration - Auto-detect if API key is available
  const [useGoogleMaps, setUseGoogleMaps] = useState(
    !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );

  // Debounced phone number lookup
  const lookupCustomerByPhone = useCallback(async (phone) => {
    if (!phone || phone.length < 10) {
      setShowHistory(false);
      setCustomerHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    setShowHistory(true);

    try {
      const response = await fetch(`/api/customer/lookup?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.found && data.customer) {
          // Auto-fill customer data
          if (data.customer.name && !customer.name) {
            onCustomerChange("name", data.customer.name);
          }
          if (data.customer.address && !customer.address) {
            onCustomerChange("address", data.customer.address);
          }
          if (data.customer.postalCode && !customer.postalCode) {
            onCustomerChange("postalCode", data.customer.postalCode);
          }
          setCustomerHistory(data.orders || []);
        } else {
          setCustomerHistory([]);
        }
      }
    } catch (error) {
      console.error("Error looking up customer:", error);
      setCustomerHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [customer.name, customer.address, customer.postalCode, onCustomerChange]);

  // Debounced postal code lookup for address suggestions
  const lookupAddressByPostal = useCallback(async (postalCode) => {
    if (!postalCode || postalCode.length < 5) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setIsLookingUpPostal(true);

    try {
      const response = await fetch(`/api/address/lookup?postalCode=${encodeURIComponent(postalCode)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.found && data.addresses && data.addresses.length > 0) {
          setAddressSuggestions(data.addresses);
          setShowAddressSuggestions(true);
          setSelectedAddressIndex(0); // Auto-select first option
          setAddressSource(data.source || 'unknown'); // Track data source
        } else {
          setAddressSuggestions([]);
          setShowAddressSuggestions(false);
          setAddressSource('none');
        }
      }
    } catch (error) {
      console.error("Error looking up postal code:", error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      setAddressSource('error');
    } finally {
      setIsLookingUpPostal(false);
    }
  }, []);

  // Handle address selection from suggestions
  const handleAddressSelect = useCallback((address) => {
    onCustomerChange("address", address.line1);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setSelectedAddressIndex(-1);
    // Focus next field for fast workflow
    setTimeout(() => {
      const notesField = document.querySelector('input[placeholder*="Order Notes"]');
      if (notesField) notesField.focus();
    }, 100);
  }, [onCustomerChange]);

  // Handle Google Maps address selection
  const handleGoogleAddressSelect = useCallback((addressData) => {
    // Auto-fill all fields from Google Maps data
    onCustomerChange("address", addressData.line1);
    if (addressData.postcode && !customer.postalCode) {
      onCustomerChange("postalCode", addressData.postcode);
    }
    // Focus next field
    setTimeout(() => {
      const notesField = document.querySelector('input[placeholder*="Order Notes"]');
      if (notesField) notesField.focus();
    }, 100);
  }, [onCustomerChange, customer.postalCode]);

  // Handle phone number change with debouncing
  const handlePhoneChange = (value) => {
    onCustomerChange("phone", value);
    
    if (phoneDebounceTimer) {
      clearTimeout(phoneDebounceTimer);
    }

    const timer = setTimeout(() => {
      lookupCustomerByPhone(value);
    }, 800);
    
    setPhoneDebounceTimer(timer);
  };

  // Handle postal code change with debouncing
  const handlePostalChange = (value) => {
    onCustomerChange("postalCode", value.toUpperCase());
    
    if (postalDebounceTimer) {
      clearTimeout(postalDebounceTimer);
    }

    const timer = setTimeout(() => {
      lookupAddressByPostal(value);
    }, 600); // Faster for better UX
    
    setPostalDebounceTimer(timer);
  };

  // Keyboard navigation for address suggestions
  const handlePostalKeyDown = (e) => {
    if (!showAddressSuggestions || addressSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedAddressIndex(prev => 
          prev < addressSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedAddressIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedAddressIndex >= 0 && selectedAddressIndex < addressSuggestions.length) {
          handleAddressSelect(addressSuggestions[selectedAddressIndex]);
        }
        break;
      case 'Escape':
        setShowAddressSuggestions(false);
        setSelectedAddressIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddressSuggestions && 
          postalInputRef.current && 
          !postalInputRef.current.contains(event.target) &&
          addressInputRef.current &&
          !addressInputRef.current.contains(event.target)) {
        setShowAddressSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddressSuggestions]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (phoneDebounceTimer) clearTimeout(phoneDebounceTimer);
      if (postalDebounceTimer) clearTimeout(postalDebounceTimer);
    };
  }, [phoneDebounceTimer, postalDebounceTimer]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Order Information</h3>
          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{orderType}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select
            value={orderType}
            onChange={(e) => onOrderTypeChange(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            <option>Dine In</option>
            <option>Take Away</option>
            <option>Delivery</option>
          </select>
          
          <input
            placeholder="Customer Name"
            value={customer.name}
            onChange={(e) => onCustomerChange("name", e.target.value)}
            className={inputClass}
          />
          
          <div className="relative">
            <input
              placeholder="Phone (autofills data) *"
              value={customer.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`${inputClass} ${isLoadingHistory ? 'pr-10' : ''}`}
            />
            {isLoadingHistory && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={postalInputRef}>
            <input
              placeholder="Postal Code (shows addresses) *"
              value={customer.postalCode}
              onChange={(e) => handlePostalChange(e.target.value)}
              onKeyDown={handlePostalKeyDown}
              className={`${inputClass} ${isLookingUpPostal ? 'pr-10' : ''} uppercase`}
              disabled={useGoogleMaps} // Disabled when using Google Maps
            />
            {isLookingUpPostal && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
              </div>
            )}
            
            {/* Address Suggestions Dropdown (only shown when NOT using Google Maps) */}
            {!useGoogleMaps && (
              <AddressSuggestions
                addresses={addressSuggestions}
                isVisible={showAddressSuggestions}
                onSelect={handleAddressSelect}
                selectedIndex={selectedAddressIndex}
                source={addressSource}
              />
            )}
          </div>
          
          <div className="relative sm:col-span-2" ref={addressInputRef}>
            {useGoogleMaps ? (
              // Google Maps Autocomplete - Easiest option, just type and select!
              <AddressAutocomplete
                value={customer.address}
                onChange={(e) => onCustomerChange("address", e.target.value)}
                onAddressSelect={handleGoogleAddressSelect}
                placeholder="Start typing your address... (powered by Google Maps)"
              />
            ) : (
              // Original postal code method
              <input
                placeholder="Address Line 1 (select from dropdown)"
                value={customer.address}
                onChange={(e) => onCustomerChange("address", e.target.value)}
                className={inputClass}
              />
            )}
          </div>
          
          <input
            placeholder="Order Notes (optional)"
            value={customer.notes || ""}
            onChange={(e) => onCustomerChange("notes", e.target.value)}
            className={`${inputClass} sm:col-span-2 lg:col-span-3`}
          />
        </div>
      </div>

      {/* Professional Customer Summary Card */}
      <CustomerSummaryCard 
        customer={customer}
        orderHistory={customerHistory}
      />

      {/* Customer History Section */}
      {showHistory && (
        <CustomerHistory orders={customerHistory} isLoading={isLoadingHistory} />
      )}
    </div>
  );
}
