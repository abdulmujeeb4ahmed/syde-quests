import { NextResponse } from 'next/server';
import { searchPlaces, getPlacesByCategory, getPopularPlaces } from '../../../lib/places-api';

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
      console.log('API: Returning cached places');
      return NextResponse.json(cached.data);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = radius ? parseFloat(radius) : 5;
    const searchLimit = limit ? parseInt(limit) : 20;

    let places = [];

    try {
      if (type === 'category' && category) {
        // Get places by specific category
        places = await getPlacesByCategory(userLat, userLng, category, searchRadius);
      } else if (type === 'popular') {
        // Get popular places (mix of categories)
        places = await getPopularPlaces(userLat, userLng);
      } else {
        // Default: search for tourist attractions
        places = await searchPlaces({
          lat: userLat,
          lng: userLng,
          radius: searchRadius,
          category: category || 'tourist_attraction',
          limit: searchLimit
        });
      }

      const responseData = {
        places,
        total: places.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius
      };

      // Cache the response
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);

    } catch (apiError) {
      console.error('Places API error:', apiError);
      
      // Fallback to hardcoded data if API fails
      const fallbackPlaces = [
        {
          id: 'fallback-1',
          name: 'Centennial Olympic Park',
          category: 'Culture',
          description: 'Explore the heart of Atlanta\'s Olympic legacy with its beautiful fountains, sculptures, and green spaces.',
          lat: 33.7606,
          lng: -84.3933,
          address: '265 Park Ave W NW, Atlanta, GA 30313, USA',
          city: 'Atlanta',
          state: 'Georgia',
          country: 'USA',
          rating: 5
        },
        {
          id: 'fallback-2',
          name: 'Piedmont Park',
          category: 'Nature',
          description: 'Enjoy Atlanta\'s largest park with skyline views, lake reflections, and diverse landscapes.',
          lat: 33.7859,
          lng: -84.3734,
          address: 'Piedmont Park, Atlanta, GA, USA',
          city: 'Atlanta',
          state: 'Georgia',
          country: 'USA',
          rating: 5
        }
      ];

      const fallbackData = {
        places: fallbackPlaces,
        total: fallbackPlaces.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius,
        fallback: true
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
