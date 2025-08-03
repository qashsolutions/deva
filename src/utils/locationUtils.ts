import { Coordinates } from '../types';

// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates,
  unit: 'miles' | 'km' = 'miles'
): number => {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

export const formatDistance = (distance: number, unit: 'miles' | 'km' = 'miles'): string => {
  if (distance < 0.1) return 'Less than 0.1 ' + unit;
  if (distance === 1) return '1 ' + (unit === 'miles' ? 'mile' : 'kilometer');
  return `${distance} ${unit}`;
};

export const isWithinRadius = (
  center: Coordinates,
  point: Coordinates,
  radius: number,
  unit: 'miles' | 'km' = 'miles'
): boolean => {
  const distance = calculateDistance(center, point, unit);
  return distance <= radius;
};

export const sortByDistance = <T extends { coordinates: Coordinates }>(
  items: T[],
  center: Coordinates,
  ascending: boolean = true
): T[] => {
  return [...items].sort((a, b) => {
    const distA = calculateDistance(center, a.coordinates);
    const distB = calculateDistance(center, b.coordinates);
    return ascending ? distA - distB : distB - distA;
  });
};

export const getBounds = (
  center: Coordinates,
  radiusMiles: number
): { north: number; south: number; east: number; west: number } => {
  const lat = center.lat;
  const lng = center.lng;
  
  // Rough approximation: 1 degree latitude = 69 miles
  const latDelta = radiusMiles / 69;
  
  // Longitude delta varies by latitude
  const lngDelta = radiusMiles / (69 * Math.cos(toRad(lat)));
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
};

export const validateCoordinates = (coordinates: Coordinates): boolean => {
  const { lat, lng } = coordinates;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string => {
  const parts = [address.street, address.city, address.state, address.zipCode]
    .filter(Boolean);
  return parts.join(', ');
};

export const parseAddress = (fullAddress: string): {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
} => {
  const parts = fullAddress.split(',').map(p => p.trim());
  const zipMatch = parts[parts.length - 1]?.match(/(\d{5}(-\d{4})?)/);
  
  let result: any = {};
  
  if (zipMatch) {
    result.zipCode = zipMatch[0];
    const stateAndZip = parts[parts.length - 1];
    const state = stateAndZip.replace(zipMatch[0], '').trim();
    if (state) result.state = state;
    
    if (parts.length > 2) {
      result.city = parts[parts.length - 2];
      result.street = parts.slice(0, parts.length - 2).join(', ');
    } else if (parts.length === 2) {
      result.city = parts[0];
    }
  } else {
    // No zip code found, do best effort parsing
    if (parts.length >= 3) {
      result.street = parts[0];
      result.city = parts[1];
      result.state = parts[2];
    } else if (parts.length === 2) {
      result.street = parts[0];
      result.city = parts[1];
    } else if (parts.length === 1) {
      result.street = parts[0];
    }
  }
  
  return result;
};

export const getZipCodeFromCoordinates = async (
  coordinates: Coordinates
): Promise<string | null> => {
  try {
    // In a real app, this would call a geocoding API
    // For now, returning null as placeholder
    console.log('Geocoding coordinates:', coordinates);
    return null;
  } catch (error) {
    console.error('Error getting zip code:', error);
    return null;
  }
};

export const getCoordinatesFromZipCode = async (
  zipCode: string
): Promise<Coordinates | null> => {
  try {
    // In a real app, this would call a geocoding API
    // For now, returning null as placeholder
    console.log('Geocoding zip code:', zipCode);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

// US state abbreviations
export const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming'
};

export const getStateFromZipCode = (zipCode: string): string | null => {
  // Simple zip code to state mapping (first digit based)
  const firstDigit = zipCode.charAt(0);
  const zipToState: Record<string, string[]> = {
    '0': ['CT', 'MA', 'ME', 'NH', 'NJ', 'RI', 'VT'],
    '1': ['DE', 'NY', 'PA'],
    '2': ['DC', 'MD', 'NC', 'SC', 'VA', 'WV'],
    '3': ['AL', 'FL', 'GA', 'MS', 'TN'],
    '4': ['IN', 'KY', 'MI', 'OH'],
    '5': ['IA', 'MN', 'MT', 'ND', 'SD', 'WI'],
    '6': ['IL', 'KS', 'MO', 'NE'],
    '7': ['AR', 'LA', 'OK', 'TX'],
    '8': ['AZ', 'CO', 'ID', 'NM', 'NV', 'UT', 'WY'],
    '9': ['AK', 'CA', 'HI', 'OR', 'WA'],
  };
  
  // This is a simplified mapping - in production, use a proper API
  const states = zipToState[firstDigit];
  return states ? states[0] : null;
};