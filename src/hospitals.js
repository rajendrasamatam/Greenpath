// For a real application, fetch this data from your Firestore database.
export const hospitals = [
  {
    id: 1,
    name: "Apollo Hospital, Jubilee Hills",
    lat: 17.4201,
    lng: 78.4116,
    address: "Jubilee Hills, Hyderabad, Telangana 500033",
    phone: "+91 40 2360 7777"
  },
  {
    id: 2,
    name: "KIMS Hospitals, Secunderabad",
    lat: 17.4415,
    lng: 78.4988,
    address: "Secunderabad, Hyderabad, Telangana 500003",
    phone: "+91 40 4488 5000"
  },
  {
    id: 3,
    name: "Yashoda Hospitals, Somajiguda",
    lat: 17.4212,
    lng: 78.4589,
    address: "Somajiguda, Hyderabad, Telangana 500082",
    phone: "+91 40 4567 4567"
  },
  {
    id: 4,
    name: "Continental Hospitals, Gachibowli",
    lat: 17.4339,
    lng: 78.3619,
    address: "Gachibowli, Hyderabad, Telangana 500032",
    phone: "+91 40 6700 0000"
  }
];

// Sample traffic signals for simulation. In a real system, these would be IoT devices.
export const trafficSignals = [
    { id: 'ts_01', name: 'Jubilee Hills Check Post', lat: 17.4299, lng: 78.4192, status: 'RED' },
    { id: 'ts_02', name: 'KBR Park Junction', lat: 17.4230, lng: 78.4350, status: 'RED' },
    { id: 'ts_03', name: 'Panjagutta X Roads', lat: 17.4247, lng: 78.4523, status: 'RED' },
    { id: 'ts_04', name: 'Begumpet Traffic Signal', lat: 17.4452, lng: 78.4651, status: 'RED' },
    { id: 'ts_05', name: 'Paradise Circle', lat: 17.4489, lng: 78.4941, status: 'RED' },
    { id: 'ts_06', name: 'Gachibowli Flyover', lat: 17.4435, lng: 78.3498, status: 'RED' },
];

/**
 * Calculates the distance between two lat-lng coordinates in meters.
 * @param {object} p1 - First point {lat, lng}
 * @param {object} p2 - Second point {lat, lng}
 * @returns {number} Distance in meters
 */
export const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const R = 6371e3; // metres
  const φ1 = p1.lat * Math.PI/180;
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat-p1.lat) * Math.PI/180;
  const Δλ = (p2.lng-p1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};