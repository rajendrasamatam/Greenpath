import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, LogOut, User as UserIcon, Settings, Bell, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const libraries: ("places")[] = ['places'];

// Helper function to calculate distance between two lat/lng points in meters
const haversineDistance = (
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const apiKey = "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  // This state will hold the last location that triggered a hospital fetch
  const [lastProcessedLocation, setLastProcessedLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  // *** UPDATED LOCATION LOGIC WITH DISTANCE CHECK ***
  useEffect(() => {
    let watchId: number | null = null;
    const DISTANCE_THRESHOLD_METERS = 100; // Only update if moved more than 100 meters

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // If this is the first location update, or we have moved enough
          if (!lastProcessedLocation || haversineDistance(lastProcessedLocation, newLocation) > DISTANCE_THRESHOLD_METERS) {
            console.log(`Significant movement detected. Updating location.`);
            setCurrentLocation(newLocation);
            setLastProcessedLocation(newLocation); // Set the new location as the last processed one
            setLastUpdate(new Date());
            setLocationError(null);
          }
        },
        (error) => {
          let errorMessage = `Location Error: ${error.message}`;
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable it in your browser settings.";
          }
          setLocationError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [lastProcessedLocation]); // Re-run effect if lastProcessedLocation changes (though it won't re-setup the watch)

  const toggleUserDropdown = () => setIsUserDropdownOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentLocation || !isLoaded) return;
    
    setHospitalFetchStatus('loading');
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request: google.maps.places.PlaceSearchRequest = {
      location: currentLocation,
      radius: 15000,
      type: 'hospital',
      keyword: 'multi specialty hospital',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const hospitals = results.map(place => ({
          id: place.place_id,
          name: place.name,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          address: place.vicinity || 'Address not available',
        })).filter(h => h.id && h.lat && h.lng);

        setNearbyMultiSpecialtyHospitals(hospitals.length > 0 ? hospitals : []);
        setHospitalFetchStatus(hospitals.length > 0 ? 'success' : 'empty');
      } else {
        setNearbyMultiSpecialtyHospitals([]);
        setHospitalFetchStatus('error');
      }
    });
  }, [currentLocation, isLoaded]);

  const handleNavigateToHospital = (hospital: any) => {
    if (currentLocation && hospital.lat && hospital.lng) {
      const origin = `${currentLocation.lat},${currentLocation.lng}`;
      const destination = `${hospital.lat},${hospital.lng}`;
      window.open(`https://maps.google.com/?q=${destination}`, '_blank');
      setSelectedHospital(hospital);
    }
  };
  
  // (The rest of your JSX remains the same)
  // ... Paste your existing return (...) statement here ...
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
                {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : 'Acquiring...'}
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
              <strong>{locationError}</strong>
            </div>
          )}
          <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-250px)] scroll-smooth">
            {hospitalFetchStatus === 'loading' && !locationError && (
              <p className="text-gray-500 px-2">Searching for hospitals within 15km...</p>
            )}
            {hospitalFetchStatus === 'empty' && (
              <p className="text-gray-500 px-2">No multi specialty hospitals found within 15km.</p>
            )}
            {hospitalFetchStatus === 'error' && (
              <p className="text-red-500 px-2">Error fetching hospitals. The service may be temporarily unavailable.</p>
            )}
            {hospitalFetchStatus === 'success' && nearbyMultiSpecialtyHospitals.length > 0 && (
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
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-300 flex-shrink-0"
                  >
                    Navigate
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;