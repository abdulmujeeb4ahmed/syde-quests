/**
 * Free local places API using OpenStreetMap Nominatim
 * No API key required, completely free
 */

export interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country: string;
  rating?: number;
  website?: string;
  phone?: string;
  hours?: string;
}

export interface PlacesSearchParams {
  lat: number;
  lng: number;
  radius?: number; // in km, default 5
  category?: string; // e.g., 'restaurant', 'tourist_attraction', 'park'
  limit?: number; // default 20
}

/**
 * Search for places near a location using OpenStreetMap
 */
export async function searchPlaces(params: PlacesSearchParams): Promise<Place[]> {
  const { lat, lng, radius = 5, category = 'tourist_attraction', limit = 20 } = params;
  
  try {
    // Build search query
    let query = '';
    if (category === 'restaurant') {
      query = 'restaurants';
    } else if (category === 'park') {
      query = 'parks';
    } else if (category === 'museum') {
      query = 'museums';
    } else if (category === 'shopping') {
      query = 'shopping centers';
    } else {
      query = 'tourist attractions';
    }
    
    // Add location context
    const locationQuery = `near ${lat},${lng}`;
    
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${query} ${locationQuery}`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('extratags', '1');
    url.searchParams.set('namedetails', '1');
    
    console.log('Fetching places from:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SydeQuests/1.0 (Local Places Discovery App)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to our Place interface
    const places: Place[] = data.map((item: any, index: number) => {
      const address = item.display_name || '';
      const addressParts = address.split(', ');
      
      return {
        id: `osm-${item.place_id || index}`,
        name: item.name || item.display_name?.split(',')[0] || 'Unknown Place',
        category: mapOSMCategory(item.type, item.class),
        description: generatePlaceDescription(item),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: address,
        city: extractCity(addressParts),
        state: extractState(addressParts),
        country: extractCountry(addressParts),
        rating: Math.floor(Math.random() * 2) + 4, // Random 4-5 star rating
        website: item.extratags?.website,
        phone: item.extratags?.phone,
        hours: item.extratags?.opening_hours
      };
    });
    
    // Filter by radius if specified
    const filteredPlaces = places.filter(place => {
      const distance = calculateDistance(lat, lng, place.lat, place.lng);
      return distance <= radius;
    });
    
    return filteredPlaces;
    
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

/**
 * Get places by category near a location
 */
export async function getPlacesByCategory(
  lat: number, 
  lng: number, 
  category: string, 
  radius: number = 5
): Promise<Place[]> {
  return searchPlaces({ lat, lng, category, radius });
}

/**
 * Get popular places near a location
 */
export async function getPopularPlaces(lat: number, lng: number): Promise<Place[]> {
  // Get a mix of different categories
  const categories = ['tourist_attraction', 'restaurant', 'park', 'museum'];
  const allPlaces: Place[] = [];
  
  for (const category of categories) {
    const places = await searchPlaces({ lat, lng, category, radius: 10, limit: 5 });
    allPlaces.push(...places);
  }
  
  // Sort by rating and return top places
  return allPlaces
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 20);
}

/**
 * Map OpenStreetMap categories to our quest categories
 */
function mapOSMCategory(type: string, classType: string): string {
  const categoryMap: { [key: string]: string } = {
    'tourism': 'Culture',
    'amenity': 'Food',
    'leisure': 'Nature',
    'shop': 'Shopping',
    'historic': 'History',
    'natural': 'Nature',
    'sport': 'Adventure'
  };
  
  return categoryMap[classType] || 'Culture';
}

/**
 * Generate a description for a place
 */
function generatePlaceDescription(item: any): string {
  const name = item.name || 'this location';
  const type = item.type || 'place';
  
  const descriptions = {
    'restaurant': `Discover the local flavors at ${name}. A great spot to experience the area's culinary scene.`,
    'park': `Enjoy the natural beauty of ${name}. Perfect for outdoor activities and relaxation.`,
    'museum': `Explore the cultural heritage at ${name}. Learn about the area's history and art.`,
    'tourist_attraction': `Visit the famous ${name}. A must-see destination that showcases the local character.`,
    'shopping': `Browse unique finds at ${name}. Discover local products and souvenirs.`
  };
  
  return descriptions[type] || `Visit ${name} and discover what makes this place special.`;
}

/**
 * Extract city from address parts
 */
function extractCity(addressParts: string[]): string {
  // Look for city in the address parts
  for (const part of addressParts) {
    if (part.includes('City') || part.match(/^[A-Z][a-z]+$/)) {
      return part.replace(' City', '');
    }
  }
  return addressParts[addressParts.length - 3] || 'Unknown City';
}

/**
 * Extract state from address parts
 */
function extractState(addressParts: string[]): string {
  // Look for state in the address parts
  for (const part of addressParts) {
    if (part.match(/^[A-Z]{2}$/) || part.includes('State')) {
      return part;
    }
  }
  return addressParts[addressParts.length - 2] || 'Unknown State';
}

/**
 * Extract country from address parts
 */
function extractCountry(addressParts: string[]): string {
  return addressParts[addressParts.length - 1] || 'Unknown Country';
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
