import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../supabaseClient';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { FaPlus, FaMinus } from 'react-icons/fa';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_POSITION = { lat: 40.7128, lng: -74.006 };
const DEFAULT_RADIUS = 5;
const MIN_RADIUS = 1;
const MAX_RADIUS = 100;

function milesToMeters(miles: number) {
  return miles * 1609.34;
}

// Add state abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

// Helper to fit bounds to circle
function FitCircleBounds({ center, radiusMeters }: { center: { lat: number; lng: number }, radiusMeters: number }) {
  const map = useMap();
  useMapEvent('load', () => {
    if (!center || !radiusMeters) return;
    const circle = L.circle([center.lat, center.lng], { radius: radiusMeters });
    map.fitBounds(circle.getBounds(), { padding: [20, 20] });
  });
  return null;
}

interface LocationSectionProps {
  location: string;
  radius: number;
  latitude: number;
  longitude: number;
  onLocationUpdated: (location: string, radius: number, latitude: number, longitude: number) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({ location, radius, latitude, longitude, onLocationUpdated }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: latitude || DEFAULT_POSITION.lat, lng: longitude || DEFAULT_POSITION.lng });
  const [localRadius, setLocalRadius] = useState<number>(radius || DEFAULT_RADIUS);
  const [city, setCity] = useState<string>(location || '');
  const [cityLoading, setCityLoading] = useState(false);

  // Update local state if props change
  useEffect(() => {
    // If we have coordinates, use them; otherwise try to geocode the location string
    if (latitude && longitude) {
      setPosition({ lat: latitude, lng: longitude });
    } else if (location) {
      // Try to get coordinates from the location string
      const geocodeLocation = async () => {
        try {
          // First try to get from our predefined coordinates
          const { NY_CITY_COORDS } = await import('../../data/sampleJobs');
          const coordinates = NY_CITY_COORDS[location];
          if (coordinates) {
            setPosition({ lat: coordinates.lat, lng: coordinates.lng });
            return;
          }
          
          // If not found in predefined list, try to geocode using Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
            // Also save these coordinates to the database
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              await supabase
                .from('profiles')
                .update({ latitude: parseFloat(lat), longitude: parseFloat(lon) })
                .eq('id', userData.user.id);
            }
          } else {
            // Fallback to default position
            setPosition(DEFAULT_POSITION);
          }
        } catch (error) {
          console.error('[LocationSection] Error geocoding location:', error);
          setPosition(DEFAULT_POSITION);
        }
      };
      geocodeLocation();
    } else {
      setPosition(DEFAULT_POSITION);
    }
    setLocalRadius(radius || DEFAULT_RADIUS);
    setCity(location || '');
  }, [latitude, longitude, radius, location]);

  // Reverse geocode to get city/town name - only when position changes from user interaction, not from props
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return; // Skip the first load to prevent infinite loop
    }
    
    async function fetchCity() {
      setCityLoading(true);
      let newCity = '';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=10&addressdetails=1`);
        const data = await res.json();
        const address = data.address || {};
        // Remove prefixes like 'Town of', 'City of', etc.
        function cleanPlaceName(name: string | undefined) {
          if (!name) return '';
          return name.replace(/^(Town|City|Village|County|Hamlet) of /i, '').trim();
        }
        let cityPart = cleanPlaceName(address.city || address.town || address.village || address.hamlet);
        let statePart = address.state;
        let suburbPart = cleanPlaceName(address.suburb);
        let stateAbbr = statePart && STATE_ABBREVIATIONS[statePart] ? STATE_ABBREVIATIONS[statePart] : statePart;
        // If city and state are the same, only show city + state abbreviation
        let cityDisplay = '';
        if (cityPart && statePart && cityPart === statePart) {
          cityDisplay = [cityPart, stateAbbr].filter(Boolean).join(', ');
        } else {
          cityDisplay = [suburbPart, cityPart, stateAbbr].filter(Boolean).join(', ');
        }
        newCity = cityDisplay;
        setCity(newCity);
        onLocationUpdated(newCity, localRadius, position.lat, position.lng);
      } catch {
        newCity = '';
        setCity('');
      }
      setCityLoading(false);
    }
    fetchCity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng]);

  function LocationMarker() {
    useMapEvents({
      click: async (e) => {
        setPosition(e.latlng);
        // Reverse geocode and save to Supabase
        let newCity = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const address = data.address || {};
          newCity = address.city || address.town || address.village || address.hamlet || address.county || '';
          setCity(newCity);
        } catch {
          newCity = '';
        }
        onLocationUpdated(newCity, localRadius, e.latlng.lat, e.latlng.lng);
        // Save to Supabase
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { error } = await supabase
            .from('profiles')
            .update({ latitude: e.latlng.lat, longitude: e.latlng.lng, location: newCity })
            .eq('id', userData.user.id);
          if (error) {
            console.error('[LocationSection] Failed to save location to Supabase:', error);
          } else {
            console.log('[LocationSection] Successfully saved location to Supabase:', { lat: e.latlng.lat, lng: e.latlng.lng, city: newCity });
          }
        }
      },
    });
    return null;
  }

  const handleRadiusChange = async (newRadius: number) => {
    setLocalRadius(newRadius);
    onLocationUpdated(city, newRadius, position.lat, position.lng);
    // Save to Supabase
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase
        .from('profiles')
        .update({ radius: newRadius })
        .eq('id', userData.user.id);
      if (error) {
        console.error('[LocationSection] Failed to save radius to Supabase:', error);
      } else {
        console.log('[LocationSection] Successfully saved radius to Supabase:', newRadius);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-0 mb-2 relative" style={{ minHeight: '220px' }}>
        <div className="w-full relative" style={{ height: 220 }}>
          <div className="rounded-xl" style={{ width: '100%', position: 'relative', zIndex: 0, overflow: 'hidden', height: 220, background: 'transparent' }}>
            <MapContainer
              center={position}
              zoom={11}
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
                    // Reverse geocode and save to Supabase
                    let newCity = '';
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=10&addressdetails=1`);
                      const data = await res.json();
                      const address = data.address || {};
                      newCity = address.city || address.town || address.village || address.hamlet || address.county || '';
                      setCity(newCity);
                    } catch {
                      newCity = '';
                    }
                  onLocationUpdated(newCity, localRadius, latlng.lat, latlng.lng);
                  // Save to Supabase
                    const { data: userData } = await supabase.auth.getUser();
                    if (userData.user) {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ latitude: latlng.lat, longitude: latlng.lng, location: newCity })
                        .eq('id', userData.user.id);
                    }
                  },
                }}
              />
              <Circle
                center={position}
              radius={milesToMeters(localRadius)}
                pathOptions={{ color: '#6C2BD7', fillColor: '#A259FF', fillOpacity: 0.13 }}
              />
              <LocationMarker />
            <FitCircleBounds center={position} radiusMeters={milesToMeters(localRadius)} />
            </MapContainer>
          </div>
          <div className="backdrop-blur-md bg-white/70 rounded-xl flex flex-row items-center justify-between px-4 py-3 z-0 border border-gray-200" style={{ width: '90%', maxWidth: 480, position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 50%)', borderRadius: '0.75rem', boxShadow: 'none' }}>
            <span className="text-base font-semibold text-gray-800">
              {cityLoading ? 'Loading...' : city ? city : `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-purple-600"
              onClick={() => handleRadiusChange(Math.max(MIN_RADIUS, localRadius - 1))}
                aria-label="Decrease radius"
              >
                <FaMinus />
              </button>
            <span className="text-base font-semibold text-gray-800 min-w-[40px] text-center">{localRadius} mi</span>
              <button
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-purple-600"
              onClick={() => handleRadiusChange(Math.min(MAX_RADIUS, localRadius + 1))}
                aria-label="Increase radius"
              >
                <FaPlus />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default LocationSection; 