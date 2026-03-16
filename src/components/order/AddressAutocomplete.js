import { useEffect, useRef } from 'react';

/**
 * Google Maps Places Autocomplete Component
 * Provides the same address search experience as Google Maps
 * 
 * Setup: Add your Google Maps API key to .env.local:
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
 */
export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  placeholder = "Start typing address...",
  className = "",
  disabled = false 
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!inputRef.current || !window.google) return;

      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'uk' }, // Restrict to UK
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['address'] // Only show complete addresses
        }
      );

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    return () => {
      // Cleanup
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.address_components) {
      console.log('No address details available');
      return;
    }

    // Extract address components
    const addressComponents = {};
    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('street_number')) {
        addressComponents.street_number = component.long_name;
      }
      if (types.includes('route')) {
        addressComponents.route = component.long_name;
      }
      if (types.includes('locality')) {
        addressComponents.city = component.long_name;
      }
      if (types.includes('postal_town')) {
        addressComponents.town = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        addressComponents.county = component.long_name;
      }
      if (types.includes('postal_code')) {
        addressComponents.postcode = component.long_name;
      }
    });

    // Build first line of address
    const addressLine1 = [
      addressComponents.street_number,
      addressComponents.route
    ].filter(Boolean).join(' ');

    // Build full address object
    const addressData = {
      line1: addressLine1,
      city: addressComponents.city || addressComponents.town || '',
      county: addressComponents.county || '',
      postcode: addressComponents.postcode || '',
      fullAddress: place.formatted_address,
      latitude: place.geometry?.location?.lat(),
      longitude: place.geometry?.location?.lng()
    };

    // Call the parent's callback with extracted data
    if (onAddressSelect) {
      onAddressSelect(addressData);
    }

    // Update input value to show first line
    if (onChange) {
      onChange({ target: { value: addressLine1 } });
    }
  };

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        autoComplete="off"
      />
      
      {/* Google Maps Attribution (required by Terms of Service) */}
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>Powered by Google Maps</span>
      </div>
    </div>
  );
}
