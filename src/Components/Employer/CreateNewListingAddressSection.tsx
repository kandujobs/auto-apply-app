 
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_POSITION = { lat: 40.7128, lng: -74.006 };

interface CreateNewListingAddressSectionProps {
  address: string;
  latitude?: number;
  longitude?: number;
  onAddressUpdated: (address: string, latitude: number, longitude: number) => void;
}

const CreateNewListingAddressSection: React.FC<CreateNewListingAddressSectionProps> = ({ address, latitude, longitude, onAddressUpdated }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: latitude || DEFAULT_POSITION.lat, lng: longitude || DEFAULT_POSITION.lng });
  const [currentAddress, setCurrentAddress] = useState<string>(address || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosition({ lat: latitude || DEFAULT_POSITION.lat, lng: longitude || DEFAULT_POSITION.lng });
    setCurrentAddress(address || '');
  }, [latitude, longitude, address]);

  // Reverse geocode to get address
  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      const addressObj = data.address || {};
      // Compose a readable address: number, street, city
      const composed = [
        [addressObj.house_number, addressObj.road].filter(Boolean).join(' '),
        addressObj.city || addressObj.town || addressObj.village
      ].filter(Boolean).join(', ');
      setCurrentAddress(composed);
      onAddressUpdated(composed, lat, lng);
    } catch {
      setCurrentAddress('');
      onAddressUpdated('', lat, lng);
    }
    setLoading(false);
  };

  function LocationMarker() {
    useMapEvents({
      click: (e) => {
        setPosition(e.latlng);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center gap-0 mb-2 relative" style={{ minHeight: '220px' }}>
      <div className="w-full relative" style={{ height: 220 }}>
        <div className="rounded-xl" style={{ width: '100%', position: 'relative', zIndex: 0, overflow: 'hidden', height: 220, background: 'transparent' }}>
          <MapContainer
            center={position}
            zoom={16}
            style={{ width: '100%', height: '220px', overflow: 'hidden', borderRadius: '0.75rem' }}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={true}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={position}
              draggable={true}
              eventHandlers={{
                dragend: async (e) => {
                  // @ts-ignore
                  const marker = e.target;
                  const latlng = marker.getLatLng();
                  setPosition({ lat: latlng.lat, lng: latlng.lng });
                  fetchAddress(latlng.lat, latlng.lng);
                },
              }}
            />
            <LocationMarker />
          </MapContainer>
        </div>
        <div className="bg-white rounded-xl flex flex-row items-center justify-between px-4 py-3 z-0 border border-gray-200" style={{ width: '90%', maxWidth: 480, position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 50%)', borderRadius: '0.75rem', boxShadow: 'none' }}>
          <span className="text-base font-semibold text-gray-800 truncate">
            {loading ? 'Loading address...' : currentAddress || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreateNewListingAddressSection; 