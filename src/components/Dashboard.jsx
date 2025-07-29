import React, { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from '@react-google-maps/api';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';

// NOTE: This component assumes you have a firebase.ts (or .js) file configured
// and that you are handling the database logic separately.
// The `addDoc` and `db` imports have been commented out to keep this component focused on the map.
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../firebase';


const Dashboard = () => {
  // IMPORTANT: Ensure your .env file has this exact variable name
  const apiKey = import.meta.env.VITE_REACT_APP_Maps_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [directions, setDirections] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(null);
  const [directionsKey, setDirectionsKey] = useState(0);

  const mapContainerStyle = {
    width: '100%',
    height: '70vh',
    borderRadius: '12px',
  };

  // Default center is Hyderabad, India
  const center = currentLocation || { lat: 17.385044, lng: 78.486671 };

  const mapOptions = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        setLastUpdate(new Date());
        setLocationError(null);
        // You can uncomment this block if you have Firebase configured
        /*
        try {
          await addDoc(collection(db, 'ambulanceLocations'), {
            latitude: location.lat,
            longitude: location.lng,
            timestamp: serverTimestamp(),
            accuracy: position.coords.accuracy,
          });
        } catch (error) {
          console.error('Error storing location:', error);
        }
        */
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

  // Effect to get location once on initial load
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Effect to handle live tracking when enabled
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(getCurrentLocation, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isTracking, getCurrentLocation]);

  // Effect to fetch hospitals when location is available
  const fetchNearbyHospitals = useCallback(() => {
    if (!isLoaded || !currentLocation || !window.google) return;

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      location: new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng),
      radius: 15000, // Increased radius to 15km for better results
      type: 'hospital',
      keyword: 'multi specialty hospital', // Filter for relevant hospitals
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyHospitals(results.map((place) => ({
          id: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.vicinity || 'Address not available',
        })));
      } else {
        setNearbyHospitals([]);
        console.warn('Places API status:', status);
      }
    });
  }, [isLoaded, currentLocation]);

  useEffect(() => {
    fetchNearbyHospitals();
  }, [fetchNearbyHospitals]);

  const calculateRoute = useCallback((hospital) => {
    if (!isLoaded || !currentLocation || !window.google) return;
    
    // Force the DirectionsRenderer to re-mount with a new key
    setDirectionsKey((prevKey) => prevKey + 1);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: { lat: hospital.lat, lng: hospital.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          setSelectedHospital(hospital);
          setShowInfoWindow(null);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [isLoaded, currentLocation]);

  const openGoogleMaps = (hospital) => {
    if (!currentLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // This function now reliably clears the route by changing the key
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

  if (loadError) return <div>Error loading maps. Please check your API key and network connection.</div>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen">Loading Map...</div>;
  if (!apiKey) return <div className="flex items-center justify-center min-h-screen">API Key is missing. Please check your environment variables.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-red-500 p-3 rounded-full mr-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Smart Ambulance System</h1>
                <p className="text-gray-600">Emergency Traffic Clearance Dashboard</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={toggleTracking}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isTracking ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
              </button>
              {directions && (
                <button
                  onClick={clearRoute}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  Clear Route
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
            <MapPin className="w-8 h-8 text-blue-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Current Location</h3>
              <p className="text-sm text-gray-600">
                {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Getting location...'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
            <Navigation className="w-8 h-8 text-green-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Route Status</h3>
              <p className="text-sm text-gray-600 truncate">
                {selectedHospital ? `To: ${selectedHospital.name}` : 'No route selected'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
            <Clock className="w-8 h-8 text-orange-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Last Update</h3>
              <p className="text-sm text-gray-600">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Location Error:</strong> {locationError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
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
                      <button onClick={() => openGoogleMaps(showInfoWindow)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded">Open Maps</button>
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
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 px-2">Nearby Hospitals</h2>
            <div className="max-h-[65vh] overflow-y-auto pr-2">
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
                <p className="text-gray-500 px-2">Searching for hospitals near you...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
