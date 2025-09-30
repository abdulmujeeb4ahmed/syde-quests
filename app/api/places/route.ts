import { NextResponse } from 'next/server';
import { searchPlaces, getPlacesByCategory, getPopularPlaces } from '../../../lib/places-api';
import { searchGooglePlaces, mapPlaceToQuest, isInAtlanta, QuestObject } from '../../../lib/google-places-api';
import atlantaQuests from '../../../data/quests.atlanta.json';

// Simple in-memory cache to prevent excessive API calls
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const category = searchParams.get('category');
    const radius = searchParams.get('radius');
    const limit = searchParams.get('limit');
    const type = searchParams.get('type'); // 'category', 'popular', or 'search'

    // Validate required parameters
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `places-${lat}-${lng}-${category}-${radius}-${limit}-${type}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('API: Returning cached quests');
      return NextResponse.json(cached.data);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = radius ? parseFloat(radius) : 5;
    const searchLimit = limit ? parseInt(limit) : 20;

    let quests: QuestObject[] = [];

    try {
      // Check if user is in Atlanta area - use seeded quests
      if (isInAtlanta(userLat, userLng)) {
        console.log('User is in Atlanta area, using seeded quests');
        quests = atlantaQuests as QuestObject[];
      } else {
        // Use Google Places API for dynamic quests
        console.log('User is outside Atlanta, fetching dynamic quests from Google Places');
        
        // Check if we have a Google Places API key
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.log('No Google Places API key found, using fallback quests immediately');
          quests = getFallbackQuests(userLat, userLng);
        } else {
          // Map category to Google Places type
          const googleType = mapCategoryToGoogleType(category || 'tourist_attraction');
          
          // Search Google Places
          const googlePlaces = await searchGooglePlaces(
            userLat, 
            userLng, 
            searchRadius * 1000, // Convert miles to meters
            googleType,
            10 // Limit to top 10 results
          );

          // Map Google Places to quest objects
          if (googlePlaces.length > 0) {
            quests = googlePlaces.map((place, index) => mapPlaceToQuest(place, index));
          } else {
            console.log('No Google Places found, using fallback quests');
            // Use fallback quests if no Google Places results
            quests = getFallbackQuests(userLat, userLng);
          }
        }
      }

      const responseData = {
        quests,
        total: quests.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius,
        source: isInAtlanta(userLat, userLng) ? 'atlanta_seeded' : 'google_places'
      };

      // Cache the response
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);

    } catch (apiError) {
      console.error('Places API error:', apiError);
      
      // Fallback to hardcoded quest data if API fails
      const fallbackQuests: QuestObject[] = [
        {
          id: 'fallback-1',
          title: 'Centennial Olympic Park Walk',
          description: 'Explore the heart of Atlanta\'s Olympic legacy with its beautiful fountains, sculptures, and green spaces.',
          category: 'Culture',
          lat: 33.7606,
          lng: -84.3933,
          duration_min: 60,
          difficulty: 'Easy',
          city: 'Atlanta',
          tags: ['olympics', 'park', 'history', 'walking'],
          cover_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          title: 'Piedmont Park Photography',
          description: 'Capture the beauty of Atlanta\'s largest park with its skyline views, lake reflections, and diverse landscapes.',
          category: 'Nature',
          lat: 33.7859,
          lng: -84.3734,
          duration_min: 90,
          difficulty: 'Easy',
          city: 'Atlanta',
          tags: ['photography', 'park', 'nature', 'skyline'],
          cover_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          created_at: new Date().toISOString()
        }
      ];

      const fallbackData = {
        quests: fallbackQuests,
        total: fallbackQuests.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius,
        source: 'fallback',
        error: 'Couldn\'t load dynamic quests, showing fallback quests instead.'
      };

      // Cache the fallback response too
      cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now()
      });

      return NextResponse.json(fallbackData);
    }

  } catch (error) {
    console.error('Error in places API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}

/**
 * Map quest categories to Google Places API types
 */
function mapCategoryToGoogleType(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'Culture': 'museum',
    'Art': 'art_gallery',
    'Nature': 'park',
    'Food': 'restaurant',
    'Shopping': 'shopping_mall',
    'History': 'historical_site',
    'Adventure': 'amusement_park',
    'Photography': 'tourist_attraction',
    'Fitness': 'gym',
    'Wellness': 'spa',
    'Music': 'establishment',
    'Architecture': 'tourist_attraction'
  };

  return categoryMap[category] || 'tourist_attraction';
}

/**
 * Get fallback quests when Google Places API fails or returns no results
 */
function getFallbackQuests(lat: number, lng: number): QuestObject[] {
  // Generate some generic quests based on location
  const city = extractCityFromLocation(lat, lng);
  
  return [
    {
      id: `fallback-1-${Date.now()}`,
      title: `${city} City Center Exploration`,
      description: `Discover the heart of ${city} with its unique local attractions, shops, and cultural landmarks. Perfect for getting to know the area.`,
      category: 'Culture',
      lat: lat,
      lng: lng,
      duration_min: 90,
      difficulty: 'Easy',
      city: city,
      tags: ['exploration', 'local', 'culture', 'walking'],
      cover_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      created_at: new Date().toISOString()
    },
    {
      id: `fallback-2-${Date.now()}`,
      title: `${city} Food Discovery`,
      description: `Taste the local flavors of ${city}. Find authentic restaurants and cafes that showcase the area's culinary culture.`,
      category: 'Food',
      lat: lat + 0.001, // Slightly offset location
      lng: lng + 0.001,
      duration_min: 120,
      difficulty: 'Easy',
      city: city,
      tags: ['food', 'local', 'dining', 'culture'],
      cover_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      created_at: new Date().toISOString()
    },
    {
      id: `fallback-3-${Date.now()}`,
      title: `${city} Nature Walk`,
      description: `Explore the natural beauty around ${city}. Find parks, trails, or scenic spots to enjoy the outdoors.`,
      category: 'Nature',
      lat: lat - 0.001,
      lng: lng - 0.001,
      duration_min: 60,
      difficulty: 'Easy',
      city: city,
      tags: ['nature', 'walking', 'outdoor', 'peaceful'],
      cover_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Extract city name from coordinates (simplified)
 */
function extractCityFromLocation(lat: number, lng: number): string {
  // This is a simplified approach - in a real app you'd use reverse geocoding
  // For now, return a generic city name based on region
  if (lat >= 40 && lat <= 42 && lng >= -75 && lng <= -73) {
    return 'New York';
  } else if (lat >= 33 && lat <= 35 && lng >= -85 && lng <= -83) {
    return 'Georgia';
  } else if (lat >= 34 && lat <= 35 && lng >= -119 && lng <= -117) {
    return 'Los Angeles';
  } else {
    return 'Local Area';
  }
}
