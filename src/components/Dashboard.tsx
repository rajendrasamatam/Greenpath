import React, { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from '@react-google-maps/api';
import { MapPin, Navigation, Clock, AlertTriangle, LayoutDashboard, LogOut, User as UserIcon, Settings, Bell } from 'lucide-react';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

// Define the props interface for the Dashboard component
interface DashboardProps {
  user: User;
}

// Define libraries array outside the component to prevent re-renders
const libraries: ("places")[] = ['places'];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const apiKey = import.meta.env.VITE_REACT_APP_Maps_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries, // Use the constant here
  });

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState<any | null>(null);
  const [directionsKey, setDirectionsKey] = useState(0);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
  };

  const center = currentLocation || { lat: 17.385044, lng: 78.486671 };

  const mapOptions = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const getCurrentLocation = useCallback(() => {
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
        setLocationError(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const toggleTracking = () => {
    setIsTracking((prev) => !prev);
  };

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(getCurrentLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [isTracking, getCurrentLocation]);

  // Rewritten to use the new, non-deprecated Places API
  const fetchNearbyHospitals = useCallback(async () => {
    if (!isLoaded || !currentLocation || !window.google) return;
  
    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
  
      const request: google.maps.places.SearchNearbyRequest = {
        location: currentLocation,
        radius: 15000,
        includedTypes: ['hospital'],
        // The new API uses rankPreference instead of a simple keyword for this type of search
        rankPreference: google.maps.places.RankPreference.DISTANCE,
      };
  
      const { places } = await Place.searchNearby(request);
  
      if (places.length) {
        const hospitals = places
          .filter(place => place.location) // Ensure place has a location
          .map((place) => ({
            id: place.id,
            name: place.displayName,
            lat: place.location!.lat(),
            lng: place.location!.lng(),
            address: place.formattedAddress || 'Address not available',
          }));
        setNearbyHospitals(hospitals);
      } else {
        setNearbyHospitals([]);
      }
    } catch (error) {
      console.error("Error fetching nearby hospitals with new API:", error);
      setNearbyHospitals([]);
    }
  }, [isLoaded, currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyHospitals();
    }
  }, [currentLocation, fetchNearbyHospitals]);

  const calculateRoute = useCallback((hospital: any) => {
    if (!isLoaded || !currentLocation || !window.google) return;
    setDirectionsKey((prevKey) => prevKey + 1);
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: { lat: hospital.lat, lng: hospital.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
          setSelectedHospital(hospital);
          setShowInfoWindow(null);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  }, [isLoaded, currentLocation]);

  const clearRoute = () => {
    setDirections(null);
    setSelectedHospital(null);
    setDirectionsKey((prevKey) => prevKey + 1);
  };

  const ambulanceIcon = React.useMemo(() => ({
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#4285F4" stroke="#FFFFFF" stroke-width="2"/>
        <svg x="8" y="8" xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32">
          <path fill="#FFFFFF" d="M320-200q-25 0-42.5-17.5T260-260q0-25 17.5-42.5T320-320q25 0 42.5 17.5T380-260q0 25-17.5 42.5T320-200Zm320 0q-25 0-42.5-17.5T580-260q0-25 17.5-42.5T640-320q25 0 42.5 17.5T700-260q0 25-17.5 42.5T640-200ZM180-80l80-320h520l80 320H180Zm250-140h100v-140H430v140Zm-2.5-280L180-820l248-120 252 120-48 320H427.5Z"/>
        </svg>
      </svg>
    `),
    scaledSize: isLoaded ? new window.google.maps.Size(48, 48) : undefined,
    anchor: isLoaded ? new window.google.maps.Point(24, 24) : undefined,
  }), [isLoaded]);

  const hospitalIcon = React.useMemo(() => ({
    url: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#d93025" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.48-8-12a8 8 0 0 1 16 0c0 7.52-8 12-8 12z"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M10 12h4"/><path d="M12 10v4"/></svg>`),
    scaledSize: isLoaded ? new window.google.maps.Size(36, 36) : undefined,
    anchor: isLoaded ? new window.google.maps.Point(18, 36) : undefined,
  }), [isLoaded]);

  if (loadError) return <div>Error loading maps.</div>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="h-screen flex bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col flex-shrink-0">
        <div className="p-6 text-2xl font-bold text-blue-600 border-b">
          VitalRoute
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 bg-blue-100 rounded-lg font-semibold">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Settings size={20} />
            Manage Fleet
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <UserIcon size={20} />
            My Profile
          </a>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Real-time ambulance tracking and hospital routing</p>
          </div>
          <div className="flex items-center gap-4">
             <Bell size={24} className="text-gray-500" />
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{user.displayName || user.email}</p>
                <p className="text-sm text-gray-500">Driver</p>
              </div>
            </div>
          </div>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 flex-shrink-0">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
             <MapPin className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-500">Location</h3>
              <p className="text-lg font-bold text-gray-800">
                {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
             <Navigation className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-500">Route</h3>
              <p className="text-lg font-bold text-gray-800 truncate">
                {selectedHospital ? `To Hospital` : 'None'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
             <Clock className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-500">Last Update</h3>
              <p className="text-lg font-bold text-gray-800">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
           <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
             <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-500">Tracking</h3>
              <p className={`text-lg font-bold ${isTracking ? 'text-green-500' : 'text-red-500'}`}>
                {isTracking ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
        
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex-shrink-0">
            <strong>Location Error:</strong> {locationError}
          </div>
        )}

        {/* Map and Hospitals - Flex-grow makes this section fill remaining space */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 h-full">
            <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13} options={mapOptions}>
              {currentLocation && <Marker position={currentLocation} icon={ambulanceIcon} title="Ambulance Location" />}
              {nearbyHospitals.map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={{ lat: hospital.lat, lng: hospital.lng }}
                  icon={hospitalIcon}
                  onClick={() => setShowInfoWindow(hospital)}
                  title={hospital.name}
                />
              ))}
              {showInfoWindow && (
                <InfoWindow
                  position={{ lat: showInfoWindow.lat + 0.001, lng: showInfoWindow.lng }}
                  onCloseClick={() => setShowInfoWindow(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-lg mb-2">{showInfoWindow.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{showInfoWindow.address}</p>
                    <div className="flex gap-2">
                       <button onClick={() => calculateRoute(showInfoWindow)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded">Get Route</button>
                    </div>
                  </div>
                </InfoWindow>
              )}
              <DirectionsRenderer
                key={directionsKey}
                directions={directions}
                options={{ polylineOptions: { strokeColor: '#4285F4', strokeWeight: 5 } }}
              />
            </GoogleMap>
          </div>
          <div className="lg:col-span-1 bg-white rounded-xl shadow p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2 flex-shrink-0">
                 <h2 className="text-xl font-semibold text-gray-800">Nearby Hospitals</h2>
                 <button onClick={toggleTracking} className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all ${isTracking ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                 </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {nearbyHospitals.length > 0 ? (
                nearbyHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md mb-3 ${selectedHospital?.id === hospital.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => calculateRoute(hospital)}
                  >
                    <h3 className="font-semibold text-gray-800 mb-1">{hospital.name}</h3>
                    <p className="text-xs text-gray-600">{hospital.address}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 px-2">Searching for hospitals...</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
