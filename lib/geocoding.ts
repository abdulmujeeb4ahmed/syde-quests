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
    
    // Atlanta, Georgia area approximation
    if (lat >= 33.6 && lat <= 33.9 && lng >= -84.5 && lng <= -84.2) {
      resolve({
        lat,
        lng,
        city: 'Atlanta',
        state: 'Georgia',
        country: 'United States',
        address: 'Atlanta, GA, USA'
      });
      return;
    }
    
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
    
    // Los Angeles area approximation
    if (lat >= 33.9 && lat <= 34.2 && lng >= -118.5 && lng <= -118.1) {
      resolve({
        lat,
        lng,
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        address: 'Los Angeles, CA, USA'
      });
      return;
    }
    
    // Chicago area approximation
    if (lat >= 41.7 && lat <= 42.0 && lng >= -87.8 && lng <= -87.4) {
      resolve({
        lat,
        lng,
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States',
        address: 'Chicago, IL, USA'
      });
      return;
    }
    
    // Miami area approximation
    if (lat >= 25.6 && lat <= 25.9 && lng >= -80.3 && lng <= -80.1) {
      resolve({
        lat,
        lng,
        city: 'Miami',
        state: 'Florida',
        country: 'United States',
        address: 'Miami, FL, USA'
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
    
    // Seattle area approximation
    if (lat >= 47.4 && lat <= 47.8 && lng >= -122.5 && lng <= -122.1) {
      resolve({
        lat,
        lng,
        city: 'Seattle',
        state: 'Washington',
        country: 'United States',
        address: 'Seattle, WA, USA'
      });
      return;
    }
    
    // Boston area approximation
    if (lat >= 42.2 && lat <= 42.5 && lng >= -71.2 && lng <= -70.9) {
      resolve({
        lat,
        lng,
        city: 'Boston',
        state: 'Massachusetts',
        country: 'United States',
        address: 'Boston, MA, USA'
      });
      return;
    }
    
    // Default fallback - try to determine if it's US or Canada based on latitude
    const isUS = lat >= 24.0 && lat <= 49.0 && lng >= -125.0 && lng <= -66.0;
    const isCanada = lat >= 41.0 && lat <= 84.0 && lng >= -141.0 && lng <= -52.0;
    
    if (isUS) {
      resolve({
        lat,
        lng,
        city: 'Your City',
        state: 'Your State',
        country: 'United States',
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    } else if (isCanada) {
      resolve({
        lat,
        lng,
        city: 'Your City',
        state: 'Your Province',
        country: 'Canada',
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    } else {
      resolve({
        lat,
        lng,
        city: 'Your City',
        state: 'Your State',
        country: 'Your Country',
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    }
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
