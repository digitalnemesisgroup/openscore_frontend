'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import MobileContainer from '@/components/MobileContainer';
import { MapPin, Building2, Store, Search, ArrowLeft, CheckCircle2, Crosshair } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDTm8UA4P18T18DixbSOfyWCOTVYgN1fGU';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center: India (approx) or New Delhi. We will use geolocation if possible.
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629
};

const BUSINESS_TYPES = [
  '🏭 Manufacturer',
  '📦 Super Stockist',
  '🏢 Stockist',
  '🚚 Distributor',
  '🛒 Wholesaler',
  '🏪 Retailer / Shop',
  '🤝 Dealer',
  '📋 Supplier / Vendor',
  '🏨 Service Provider',
  '🌐 Trader / Importer / Exporter',
];

const BUSINESS_CATEGORIES = [
  '🛒 1. Grocery & FMCG',
  '🥛 2. Dairy & Fresh',
  '🍔 3. Food & Restaurant',
  '💊 4. Medical & Healthcare',
  '📱 5. Electronics & Mobile',
  '⚡ 6. Electrical & Solar',
  '🏗️ 7. Construction & Hardware',
  '🚗 8. Automobile',
  '👕 9. Fashion & Lifestyle',
  '🏠 10. Home & Furniture',
  '🌾 11. Agriculture',
  '💄 12. Beauty & Personal Care',
  '👶 13. Baby, Kids & Toys',
  '🐶 14. Pet & Animal',
  '📚 15. Books, Stationery & Education',
  '🏭 16. Industrial & Business',
  '📦 17. Packaging',
  '⛽ 18. Fuel & Energy',
  '📡 19. Telecom & Digital',
  '🎁 20. Specialty & Others',
];

// Mock Nearest Stores with coordinates
const MOCK_STORES = [
  { id: 1, name: 'Apex Retail Store', type: 'Retailer / Shop', category: 'Grocery & FMCG', lat: 28.6139, lng: 77.2090 },
  { id: 2, name: 'Sharma Hardware', type: 'Dealer', category: 'Construction & Hardware', lat: 28.6239, lng: 77.2190 },
  { id: 3, name: 'Metro Electronics', type: 'Wholesaler', category: 'Electronics & Mobile', lat: 28.6039, lng: 77.1990 },
];

export default function LocationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessData, setBusinessData] = useState({
    name: '',
    number: '',
    gstin: '',
    lat: null as number | null,
    lng: null as number | null,
    address: '',
  });

  const [isDataFilled, setIsDataFilled] = useState(false);
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    // If user is business and already has business data, we can skip the form.
    let populated = false;

    // Check backend state first
    if (user?.business_type) {
      setIsDataFilled(true);
      const parts = user.business_type.split(' - ');
      setBusinessType(parts[0] || user.business_type);
      setBusinessCategory(parts[1] || '');
      
      const lat = user.business_location_lat ? parseFloat(user.business_location_lat) : null;
      const lng = user.business_location_lng ? parseFloat(user.business_location_lng) : null;
      
      setBusinessData({
        name: user.name || '',
        number: user.mobile || '',
        gstin: '',
        lat: lat,
        lng: lng,
        address: user.business_address || '',
      });

      if (lat && lng) {
        setUserLocation({ lat, lng });
      }
      populated = true;
    }

    if (!populated) {
      const stored = localStorage.getItem('businessData');
      if (stored) {
        setIsDataFilled(true);
        const parsed = JSON.parse(stored);
        setBusinessData({
          ...parsed.details,
          name: parsed.details.name || user?.name || '',
          number: parsed.details.number || user?.mobile || '',
        });
        setBusinessType(parsed.type);
        setBusinessCategory(parsed.category);
        if (parsed.details.lat && parsed.details.lng) {
          setUserLocation({ lat: parsed.details.lat, lng: parsed.details.lng });
        }
      } else if (user) {
        // Prefill for first-time form
        setBusinessData(prev => ({
          ...prev,
          name: prev.name || user.name || '',
          number: prev.number || user.mobile || ''
        }));
      }
    }
  }, [user]);

  const handleSaveBusiness = async () => {
    if (!businessData.lat || !businessData.lng) {
      alert("Please select your store location on the map.");
      return;
    }
    const data = {
      type: businessType,
      category: businessCategory,
      details: businessData
    };
    
    try {
      if (user) {
        await apiRequest('/user/business-profile', {
          method: 'POST',
          body: JSON.stringify({
            business_type: `${businessType} - ${businessCategory}`,
            business_location_lat: businessData.lat.toString(),
            business_location_lng: businessData.lng.toString(),
            business_address: businessData.name + (businessData.number ? `, Contact: ${businessData.number}` : '') + (businessData.gstin ? `, GSTIN: ${businessData.gstin}` : ''),
          })
        });
      }
      
      localStorage.setItem('businessData', JSON.stringify(data));
      setIsDataFilled(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile on the server, but it is saved locally.");
      localStorage.setItem('businessData', JSON.stringify(data));
      setIsDataFilled(true);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          if (step === 3 && !businessData.lat) {
            setBusinessData(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
          }
        },
        (error) => {
          console.error("Error fetching location", error);
        }
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (step === 3 && e.latLng) {
      setBusinessData(prev => ({
        ...prev,
        lat: e.latLng!.lat(),
        lng: e.latLng!.lng(),
      }));
    }
  }, [step]);

  const isBusiness = user?.account_type === 'business' || (user as any)?.role === 'business' || true; 
  const actualIsBusiness = user ? (user.account_type === 'business' || (user as any)?.role === 'business') : false;

  // Combine Mock stores and user's business if saved
  const allStores = [...MOCK_STORES];
  if (isDataFilled && businessData.lat && businessData.lng) {
    allStores.push({
      id: 999,
      name: businessData.name || 'Your Store',
      type: businessType,
      category: businessCategory,
      lat: businessData.lat,
      lng: businessData.lng,
    });
  }

  // Render Stores for non-business users
  if (!actualIsBusiness && user) {
    return (
      <MobileContainer>
        <div className="flex flex-col h-full bg-slate-50 relative">
          <div className="p-4 bg-white shadow-sm flex items-center gap-3 z-10 absolute top-0 w-full">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search stores..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="flex-1 w-full h-full pt-16 relative">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full">Loading Maps...</div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userLocation}
                zoom={14}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                {allStores.map(store => (
                  <Marker
                    key={store.id}
                    position={{ lat: store.lat, lng: store.lng }}
                    onClick={() => setSelectedStore(store)}
                  />
                ))}

                {selectedStore && (
                  <InfoWindow
                    position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                    onCloseClick={() => setSelectedStore(null)}
                  >
                    <div className="p-1 max-w-[200px]">
                      <h3 className="font-bold text-sm text-slate-900">{selectedStore.name}</h3>
                      <p className="text-xs text-slate-500">{selectedStore.type}</p>
                      <p className="text-xs text-slate-500">{selectedStore.category}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}

            <button 
              onClick={getUserLocation}
              className="absolute bottom-6 right-4 p-3 bg-white rounded-full shadow-lg border border-slate-200 text-purple-600"
            >
              <Crosshair className="w-6 h-6" />
            </button>
          </div>
        </div>
      </MobileContainer>
    );
  }

  // Render Business User Content
  return (
    <MobileContainer>
      <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4 bg-white shadow-sm flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Business Location</h1>
        </div>

        {!isDataFilled ? (
          <div className="p-4 flex-1 overflow-y-auto pb-24 relative flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900 mb-1">Business Details</h2>
              <p className="text-sm text-slate-500">Complete your profile and add your store to the map.</p>
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 flex-1">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">STEP 1</span>
                    आप किस प्रकार का Business हैं?
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => { setBusinessType(type); setStep(2); }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          businessType === type
                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-white border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-700">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 flex-1">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">STEP 2</span>
                    आपका Business किस Section में है?
                  </h3>
                  <div className="grid grid-cols-1 gap-2 h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setBusinessCategory(cat); setStep(3); }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          businessCategory === cat
                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-white border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-700">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-purple-600 font-semibold"
                >
                  ← Back to Step 1
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 flex-shrink-0">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">FINAL</span>
                  Add Your Store Location
                </h3>
                
                <div className="space-y-3 flex-shrink-0">
                  <div>
                    <input
                      type="text"
                      value={businessData.name}
                      onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                      placeholder="Business Name (e.g. Apex Retail)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={businessData.number}
                      onChange={(e) => setBusinessData({ ...businessData, number: e.target.value })}
                      placeholder="Mobile Number"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={businessData.gstin}
                      onChange={(e) => setBusinessData({ ...businessData, gstin: e.target.value })}
                      placeholder="GSTIN (Optional)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex-1 min-h-[250px] relative rounded-xl overflow-hidden border border-slate-200">
                  <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 shadow-sm pointer-events-none">
                    Tap on the map to pin your store
                  </div>
                  {!isLoaded ? (
                    <div className="flex items-center justify-center h-full bg-slate-100">Loading Map...</div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={userLocation}
                      zoom={15}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                      onClick={onMapClick}
                    >
                      {businessData.lat && businessData.lng && (
                        <Marker position={{ lat: businessData.lat, lng: businessData.lng }} />
                      )}
                    </GoogleMap>
                  )}
                  <button 
                    onClick={(e) => { e.preventDefault(); getUserLocation(); }}
                    className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-lg border border-slate-200 text-purple-600"
                  >
                    <Crosshair className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-3 mt-4 flex-shrink-0">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveBusiness}
                    className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
                  >
                    Register Store
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 flex-1 bg-white relative flex flex-col">
            <div className="text-center py-4 flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your Store is Live!</h2>
              <p className="text-xs text-slate-500 mb-4">Customers can now find you on the map.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{businessData.name || 'Your Business'}</h3>
                    <p className="text-xs text-slate-500">{businessType} • {businessCategory}</p>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs mt-2 border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Contact</span>
                  <span className="font-medium text-slate-800">{businessData.number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[200px] mt-2 rounded-xl overflow-hidden border border-slate-200">
               {!isLoaded ? (
                  <div className="flex items-center justify-center h-full bg-slate-100">Loading Map...</div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: businessData.lat || defaultCenter.lat, lng: businessData.lng || defaultCenter.lng }}
                    zoom={15}
                    options={{ disableDefaultUI: true }}
                  >
                    {businessData.lat && businessData.lng && (
                      <Marker position={{ lat: businessData.lat, lng: businessData.lng }} />
                    )}
                  </GoogleMap>
                )}
            </div>
              
            <button
              onClick={() => setIsDataFilled(false)}
              className="mt-4 py-3 w-full border border-purple-200 text-purple-600 rounded-xl font-bold text-sm bg-purple-50 hover:bg-purple-100"
            >
              Edit Store Details
            </button>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
