/**
 * Google Places API integration
 * Maps Google Places results to quest objects
 */

import { Client } from '@googlemaps/google-maps-services-js';

export interface QuestObject {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  duration_min: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  city?: string;
  tags?: string[];
  cover_url?: string;
  created_at?: string;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  formatted_address?: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
}

// Initialize Google Maps client
const client = new Client({});

/**
 * Search for places using Google Places Nearby Search
 */
export async function searchGooglePlaces(
  lat: number,
  lng: number,
  radius: number = 5000, // 5km radius
  type: string = 'tourist_attraction',
  limit: number = 10
): Promise<GooglePlaceResult[]> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Places API key not found, using fallback data');
      return [];
    }

    const response = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius,
        type: type as any,
        key: apiKey,
      },
    });

    if (response.data.results) {
      return response.data.results.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error('Google Places API error:', error);
    return [];
  }
}

/**
 * Get place details including photos and reviews
 */
export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'photos', 'reviews', 'website', 'opening_hours'],
        key: apiKey,
      },
    });

    return response.data.result;
  } catch (error) {
    console.error('Google Places Details API error:', error);
    return null;
  }
}

/**
 * Map Google Places result to quest object
 */
export function mapPlaceToQuest(place: GooglePlaceResult, index: number): QuestObject {
  const questId = `google-quest-${place.place_id}-${index}`;
  const category = mapGoogleTypeToQuestCategory(place.types);
  const difficulty = estimateDifficulty(place.types, place.rating);
  const duration = estimateDuration(place.types, place.user_ratings_total || 0);

  return {
    id: questId,
    title: generateQuestTitle(place.name, place.types),
    description: generateQuestDescription(place.name, place.types, place.vicinity),
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    category,
    duration_min: duration,
    difficulty,
    city: extractCityFromAddress(place.formatted_address || place.vicinity),
    tags: generateTags(place.types),
    cover_url: place.photos?.[0] ? 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}` :
      generateFallbackImage(place.types),
    created_at: new Date().toISOString()
  };
}

/**
 * Map Google Place types to quest categories
 */
function mapGoogleTypeToQuestCategory(types: string[]): string {
  const categoryMap: { [key: string]: string } = {
    'tourist_attraction': 'Culture',
    'museum': 'Culture',
    'art_gallery': 'Art',
    'park': 'Nature',
    'amusement_park': 'Adventure',
    'zoo': 'Nature',
    'aquarium': 'Nature',
    'restaurant': 'Food',
    'cafe': 'Food',
    'shopping_mall': 'Shopping',
    'store': 'Shopping',
    'church': 'Culture',
    'mosque': 'Culture',
    'synagogue': 'Culture',
    'hindu_temple': 'Culture',
    'cemetery': 'History',
    'historical_site': 'History',
    'monument': 'History',
    'library': 'Culture',
    'university': 'Culture',
    'stadium': 'Adventure',
    'gym': 'Fitness',
    'spa': 'Wellness',
    'beauty_salon': 'Wellness',
    'hospital': 'Healthcare',
    'pharmacy': 'Healthcare'
  };

  // Find the best matching category
  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  return 'Culture'; // Default fallback
}

/**
 * Estimate quest difficulty based on place type and rating
 */
function estimateDifficulty(types: string[], rating?: number): 'Easy' | 'Medium' | 'Hard' {
  const hardTypes = ['hiking_area', 'climbing', 'stadium', 'gym', 'amusement_park'];
  const mediumTypes = ['museum', 'art_gallery', 'historical_site', 'zoo', 'aquarium'];
  
  for (const type of types) {
    if (hardTypes.includes(type)) return 'Hard';
    if (mediumTypes.includes(type)) return 'Medium';
  }
  
  // If rating is low, it might be more challenging
  if (rating && rating < 3.5) return 'Medium';
  
  return 'Easy'; // Default for most tourist attractions
}

/**
 * Estimate quest duration based on place type and popularity
 */
function estimateDuration(types: string[], userRatingsTotal: number): number {
  const durationMap: { [key: string]: number } = {
    'museum': 120,
    'art_gallery': 90,
    'park': 60,
    'zoo': 180,
    'aquarium': 120,
    'amusement_park': 240,
    'restaurant': 90,
    'cafe': 45,
    'shopping_mall': 120,
    'historical_site': 90,
    'monument': 30,
    'church': 45,
    'library': 60,
    'stadium': 180,
    'spa': 120
  };

  let baseDuration = 60; // Default 1 hour
  
  for (const type of types) {
    if (durationMap[type]) {
      baseDuration = durationMap[type];
      break;
    }
  }

  // Adjust based on popularity (more popular = potentially longer wait times)
  if (userRatingsTotal > 1000) {
    baseDuration += 30;
  } else if (userRatingsTotal > 100) {
    baseDuration += 15;
  }

  return Math.min(baseDuration, 300); // Cap at 5 hours
}

/**
 * Generate engaging quest title
 */
function generateQuestTitle(name: string, types: string[]): string {
  const actionMap: { [key: string]: string } = {
    'museum': 'Discover',
    'art_gallery': 'Explore',
    'park': 'Wander Through',
    'restaurant': 'Taste the Flavors of',
    'cafe': 'Sip Coffee at',
    'shopping_mall': 'Shop at',
    'historical_site': 'Step Back in Time at',
    'monument': 'Visit the Historic',
    'church': 'Discover the Beauty of',
    'zoo': 'Meet the Animals at',
    'aquarium': 'Dive Into',
    'amusement_park': 'Experience the Thrills of'
  };

  for (const type of types) {
    if (actionMap[type]) {
      return `${actionMap[type]} ${name}`;
    }
  }

  return `Explore ${name}`;
}

/**
 * Generate engaging quest description
 */
function generateQuestDescription(name: string, types: string[], vicinity?: string): string {
  const type = types[0] || 'place';
  const location = vicinity ? ` in ${vicinity}` : '';
  
  const descriptions: { [key: string]: string } = {
    'museum': `Immerse yourself in culture and history at ${name}${location}. Discover fascinating exhibits, learn about local heritage, and connect with the stories that shaped this community.`,
    'art_gallery': `Experience the creative spirit at ${name}${location}. Explore contemporary and classical artworks, meet local artists, and discover the artistic soul of the city.`,
    'park': `Enjoy the natural beauty of ${name}${location}. Take a peaceful walk, have a picnic, or simply relax in this green oasis within the urban landscape.`,
    'restaurant': `Savor the authentic flavors of ${name}${location}. Experience local cuisine, meet the chefs, and discover why this place is beloved by locals and visitors alike.`,
    'historical_site': `Walk through history at ${name}${location}. Learn about the events and people that shaped this area, and feel connected to the past in this significant location.`,
    'monument': `Pay homage to history at ${name}${location}. Learn about the significance of this landmark and the stories it represents in the community's heritage.`,
    'church': `Discover the architectural beauty and spiritual significance of ${name}${location}. Experience the peaceful atmosphere and learn about the community's faith traditions.`,
    'zoo': `Meet amazing animals from around the world at ${name}${location}. Learn about wildlife conservation, see rare species, and create memories with family and friends.`,
    'aquarium': `Dive into an underwater world at ${name}${location}. Explore marine life, learn about ocean conservation, and discover the mysteries of the deep.`
  };

  return descriptions[type] || `Discover what makes ${name}${location} special. Explore, learn, and create lasting memories at this unique destination.`;
}

/**
 * Generate relevant tags for the quest
 */
function generateTags(types: string[]): string[] {
  const tagMap: { [key: string]: string[] } = {
    'museum': ['culture', 'history', 'education', 'artifacts'],
    'art_gallery': ['art', 'culture', 'creative', 'exhibitions'],
    'park': ['nature', 'outdoor', 'relaxation', 'green-space'],
    'restaurant': ['food', 'local', 'dining', 'cuisine'],
    'cafe': ['coffee', 'relaxation', 'local', 'social'],
    'shopping_mall': ['shopping', 'retail', 'local', 'fashion'],
    'historical_site': ['history', 'heritage', 'culture', 'educational'],
    'monument': ['history', 'landmark', 'photo-opportunity', 'significant'],
    'church': ['architecture', 'spiritual', 'peaceful', 'historic'],
    'zoo': ['animals', 'family', 'education', 'conservation'],
    'aquarium': ['marine-life', 'education', 'family', 'underwater'],
    'amusement_park': ['thrills', 'family', 'fun', 'adventure']
  };

  const tags = new Set<string>();
  
  for (const type of types) {
    if (tagMap[type]) {
      tagMap[type].forEach(tag => tags.add(tag));
    }
  }

  // Add some general tags
  tags.add('exploration');
  tags.add('local-experience');

  return Array.from(tags).slice(0, 6); // Limit to 6 tags
}

/**
 * Extract city from address
 */
function extractCityFromAddress(address?: string): string {
  if (!address) return 'Unknown City';
  
  const parts = address.split(', ');
  // Usually city is the second to last part before country
  return parts[parts.length - 2] || parts[0] || 'Unknown City';
}

/**
 * Generate fallback image URL based on place type
 */
function generateFallbackImage(types: string[]): string {
  const imageMap: { [key: string]: string } = {
    'museum': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'art_gallery': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400',
    'park': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    'restaurant': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    'shopping_mall': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    'historical_site': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    'church': 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400',
    'zoo': 'https://images.unsplash.com/photo-1549366021-9f761d0406a7?w=400',
    'aquarium': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  };

  for (const type of types) {
    if (imageMap[type]) {
      return imageMap[type];
    }
  }

  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'; // Default city image
}

/**
 * Check if user is in Atlanta area
 */
export function isInAtlanta(lat: number, lng: number): boolean {
  // Atlanta area bounds: roughly 33.6 to 34.0 lat, -84.5 to -84.1 lng
  return lat >= 33.6 && lat <= 34.0 && lng >= -84.5 && lng <= -84.1;
}
