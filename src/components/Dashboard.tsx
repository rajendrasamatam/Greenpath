import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Clock, LogOut, User as UserIcon, Settings, Bell, ChevronDown, ChevronUp, Award } from 'lucide-react';

import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [nearbyMultiSpecialtyHospitals, setNearbyMultiSpecialtyHospitals] = useState([
    { id: 'hosp1', name: 'Apollo Hospitals', address: 'Jubilee Hills, Hyderabad', lat: 17.433, lng: 78.401 },
    { id: 'hosp2', name: 'MaxCure Hospitals', address: 'Madhapur, Hyderabad', lat: 17.447, lng: 78.388 },
    { id: 'hosp3', name: 'Continental Hospital', address: 'Gachibowli, Hyderabad', lat: 17.441, lng: 78.375 },
    { id: 'hosp4', name: 'Medicover Hospitals', address: 'Hitec City, Hyderabad', lat: 17.456, lng: 78.383 },
    { id: 'hosp5', name: 'Care Hospitals', address: 'Banjara Hills, Hyderabad', lat: 17.418, lng: 78.449 },
    { id: 'hosp6', name: 'Yashoda Hospitals', address: 'Secunderabad, Hyderabad', lat: 17.438, lng: 78.502 },
  ]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null); // To highlight active route

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const getCurrentLocation = useCallback(() => {
    // In a real app, this would use navigator.geolocation.getCurrentPosition
    // For now, using dummy locations.
    const dummyLocations = [
      { lat: 17.385044, lng: 78.486671 }, // Hyderabad city center
      { lat: 17.390, lng: 78.490 },
      { lat: 17.380, lng: 78.480 },
    ];
    const randomLocation = dummyLocations[Math.floor(Math.random() * dummyLocations.length)];
    
    setCurrentLocation(randomLocation);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    getCurrentLocation();
    // Simulate continuous tracking for demo purposes
    const interval = setInterval(getCurrentLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
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

  // Function to activate route and open Google Maps for navigation
  const handleNavigateToHospital = (hospital: any) => {
    if (currentLocation && hospital.lat && hospital.lng) {
      const origin = `${currentLocation.lat},${currentLocation.lng}`;
      const destination = `${hospital.lat},${hospital.lng}`;
      // Construct Google Maps URL for directions
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      
      window.open(googleMapsUrl, '_blank'); // Open in a new tab
      setSelectedHospital(hospital); // Highlight this hospital as the active route
    } else {
      console.error("Cannot navigate: Current location or hospital destination is missing.");
      // Optionally, provide user feedback (e.g., a toast notification)
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans text-white relative overflow-hidden">
      {/* Hero Glow Effect from Landing Page */}
      <div className="absolute inset-0 hero-glow opacity-40"></div>

      {/* Header (Top Navigation) */}
      <header className="relative z-20 w-full py-6 px-4 sm:px-6 lg:px-8 bg-gray-950 border-b border-gray-800">
        <div className="max-w-full mx-auto flex justify-between items-center">
          {/* Left: SparkX Logo */}
          <h1 className="text-2xl font-bold text-blue-500">🚨 SparkX</h1>
          
          {/* Right: User Profile and Dropdown */}
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

            {/* User Dropdown Menu */}
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

      {/* Main Content Area - Dashboard Body */}
      <main className="flex-1 p-6 flex flex-col overflow-y-auto relative z-10">
        <h1 className="text-3xl font-bold text-white mb-6">Driver Dashboard</h1>
        <p className="text-gray-400 text-lg mb-8">Essential real-time information for your current operation.</p>

        {/* Info Cards - Simplified to 3 */}
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
        
        {/* Nearby Multi Specialty Hospitals List - Main content area */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 h-full flex flex-col border border-gray-800">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">Nearby Multi Specialty Hospitals</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-250px)] scroll-smooth"> {/* Adjusted max-height */}
            {nearbyMultiSpecialtyHospitals.length > 0 ? (
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
              <p className="text-gray-500 px-2">No nearby multi specialty hospitals found.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
