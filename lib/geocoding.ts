export interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  address: string;
}

/**
 * Reverse geocode coordinates to get city and state
 * For MVP, we'll use a simple approximation based on coordinates
 */
export function reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
  return new Promise((resolve) => {
    // For MVP, we'll use a simple coordinate-based approximation
    // In production, you'd use a real geocoding service like Google Maps API
    
    // Toronto area approximation
    if (lat >= 43.5 && lat <= 43.8 && lng >= -79.6 && lng <= -79.1) {
      resolve({
        lat,
        lng,
        city: 'Toronto',
        state: 'Ontario',
        country: 'Canada',
        address: 'Toronto, ON, Canada'
      });
      return;
    }
    
    // Montreal area approximation
    if (lat >= 45.4 && lat <= 45.7 && lng >= -73.8 && lng <= -73.4) {
      resolve({
        lat,
        lng,
        city: 'Montreal',
        state: 'Quebec',
        country: 'Canada',
        address: 'Montreal, QC, Canada'
      });
      return;
    }
    
    // Vancouver area approximation
    if (lat >= 49.1 && lat <= 49.4 && lng >= -123.3 && lng <= -122.9) {
      resolve({
        lat,
        lng,
        city: 'Vancouver',
        state: 'British Columbia',
        country: 'Canada',
        address: 'Vancouver, BC, Canada'
      });
      return;
    }
    
    // New York area approximation
    if (lat >= 40.6 && lat <= 40.9 && lng >= -74.1 && lng <= -73.7) {
      resolve({
        lat,
        lng,
        city: 'New York',
        state: 'New York',
        country: 'United States',
        address: 'New York, NY, USA'
      });
      return;
    }
    
    // San Francisco area approximation
    if (lat >= 37.7 && lat <= 37.9 && lng >= -122.6 && lng <= -122.3) {
      resolve({
        lat,
        lng,
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        address: 'San Francisco, CA, USA'
      });
      return;
    }
    
    // Default fallback
    resolve({
      lat,
      lng,
      city: 'Unknown City',
      state: 'Unknown State',
      country: 'Unknown Country',
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    });
  });
}

/**
 * Get a friendly location display name
 */
export function getLocationDisplayName(location: LocationInfo): string {
  if (location.city === 'Unknown City') {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }
  return `${location.city}, ${location.state}`;
}

/**
 * Get a full address string
 */
export function getFullAddress(location: LocationInfo): string {
  return location.address;
}
