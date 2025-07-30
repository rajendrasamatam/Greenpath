import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Clock, LogOut, User as UserIcon, Settings, Bell, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';

import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// Define libraries array outside the component to prevent re-renders
const libraries: ("places")[] = ['places'];

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const apiKey = "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY"; // Directly using the provided key

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [nearbyMultiSpecialtyHospitals, setNearbyMultiSpecialtyHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hospitalFetchStatus, setHospitalFetchStatus] = useState<'loading' | 'success' | 'error' | 'empty'>('loading');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLastUpdate(new Date());
          setLocationError(null);
        },
        (error) => {
          let errorMessage = `Location error: ${error.message}`;
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable location services in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "The request to get user location timed out.";
          }
          setLocationError(errorMessage);
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  // Effect for initial location fetch and continuous updates
  useEffect(() => {
    getCurrentLocation();

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLastUpdate(new Date());
          setLocationError(null);
        },
        (error) => {
          let errorMessage = `Location tracking error: ${error.message}`;
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied for continuous tracking.";
          }
          setLocationError(errorMessage);
          console.error("Geolocation watch error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [getCurrentLocation]);


  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // *** FIXED SECTION ***
  // Effect to trigger hospital fetch when location is available and API is loaded.
  // The fetching logic is now defined *inside* the effect to prevent re-creation on every render.
  useEffect(() => {
    const fetchNearbyHospitals = () => {
      if (!isLoaded || !currentLocation || !window.google || !window.google.maps.places) {
        setHospitalFetchStatus('loading');
        return;
      }
      
      setHospitalFetchStatus('loading');
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.PlaceSearchRequest = {
        location: currentLocation,
        radius: 15000, // 15 km radius
        type: 'hospital',
        keyword: 'multi specialty hospital',
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const hospitals = results.map((place) => ({
            id: place.place_id,
            name: place.name,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            address: place.vicinity || 'Address not available',
          })).filter(h => h.id && h.lat && h.lng);
          
          if (hospitals.length > 0) {
              setNearbyMultiSpecialtyHospitals(hospitals);
              setHospitalFetchStatus('success');
          } else {
              setNearbyMultiSpecialtyHospitals([]);
              setHospitalFetchStatus('empty');
          }
        } else {
          console.error(`Google Places search failed with status: ${status}`);
          setNearbyMultiSpecialtyHospitals([]);
          setHospitalFetchStatus('error');
        }
      });
    };

    if (currentLocation && isLoaded) {
      fetchNearbyHospitals();
    }
  }, [currentLocation, isLoaded]); // This effect now only runs when location or API load status changes.


  const handleNavigateToHospital = (hospital: any) => {
    if (currentLocation && hospital.lat && hospital.lng) {
      const origin = `${currentLocation.lat},${currentLocation.lng}`;
      const destination = `${hospital.lat},${hospital.lng}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      
      window.open(googleMapsUrl, '_blank');
      setSelectedHospital(hospital);
    } else {
      console.error("Cannot navigate: Current location or hospital destination is missing.");
    }
  };

  if (loadError) return <div className="text-red-500 p-4 bg-black min-h-screen flex items-center justify-center">Error loading maps services. Please check your API key and network connection.</div>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading map services...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 hero-glow opacity-40"></div>
      
      <header className="relative z-20 w-full py-6 px-4 sm:px-6 lg:px-8 bg-gray-950 border-b border-gray-800">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">🚨 Vitalroute</h1>
          
          <div className="flex items-center gap-4 user-dropdown-container">
            <Bell size={24} className="text-gray-400 cursor-pointer hover:text-white" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={toggleUserDropdown}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="font-semibold text-white">{user.displayName || user.email}</p>
                <p className="text-sm text-gray-400">Driver</p>
              </div>
              {isUserDropdownOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </div>

            {isUserDropdownOpen && (
              <div className="absolute right-4 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-30">
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800">
                  <UserIcon size={18} /> Update Profile
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800">
                  <Award size={18} /> Achievements
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800">
                  <Settings size={18} /> Account Settings
                </a>
                <div className="border-t border-gray-800 my-1"></div>
                <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col overflow-y-auto relative z-10">
        <h1 className="text-3xl font-bold text-white mb-6">Driver Dashboard</h1>
        <p className="text-gray-400 text-lg mb-8">Essential real-time information for your current operation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-800">
              <MapPin className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-400">Current Location</h3>
              <p className="text-lg font-bold text-white">
                {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-800">
              <Navigation className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-400">Active Route</h3>
              <p className="text-lg font-bold text-white truncate">
                {selectedHospital ? `To ${selectedHospital.name}` : 'None'}
              </p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-800">
              <Clock className="w-8 h-8 text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-400">Last Update</h3>
              <p className="text-lg font-bold text-white">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 h-full flex flex-col border border-gray-800">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">Nearby Multi Specialty Hospitals</h2>
          </div>
          {locationError && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4">
              <strong>Location Error:</strong> {locationError}
            </div>
          )}
          <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-250px)] scroll-smooth">
            {hospitalFetchStatus === 'loading' && (
              <p className="text-gray-500 px-2">Searching for hospitals within 15km...</p>
            )}
            {hospitalFetchStatus === 'empty' && (
              <p className="text-gray-500 px-2">No multi specialty hospitals found within 15km.</p>
            )}
            {hospitalFetchStatus === 'error' && (
              <p className="text-red-500 px-2">Error fetching hospitals. Please try again.</p>
            )}
            {hospitalFetchStatus === 'success' && nearbyMultiSpecialtyHospitals.length > 0 ? (
              nearbyMultiSpecialtyHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className={`p-3 border border-gray-800 rounded-lg transition-all mb-2 bg-gray-950 flex justify-between items-center ${selectedHospital?.id === hospital.id ? 'border-blue-600' : ''}`}
                >
                  <div>
                    <h3 className="font-semibold text-white mb-1">{hospital.name}</h3>
                    <p className="text-xs text-gray-400">{hospital.address}</p>
                  </div>
                  <button
                    onClick={() => handleNavigateToHospital(hospital)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    Navigate
                  </button>
                </div>
              ))
            ) : (
              hospitalFetchStatus === 'success' && <p className="text-gray-500 px-2">No nearby multi specialty hospitals found.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;