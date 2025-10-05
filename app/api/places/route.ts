import { NextResponse } from 'next/server';
import { searchPlaces, getPlacesByCategory, getPopularPlaces } from '../../../lib/places-api';
import { searchGooglePlaces, mapPlaceToQuest, QuestObject } from '../../../lib/google-places-api';

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
      // Always use Google Places API for real places
      console.log('Fetching real places from Google Places API');
      
      // Check if we have a Google Places API key
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.log('No Google Places API key found - API key required for real places');
        return NextResponse.json(
          { 
            error: 'Google Places API key required to fetch real places. Please configure GOOGLE_PLACES_API_KEY environment variable.',
            quests: [],
            total: 0,
            location: { lat: userLat, lng: userLng },
            radius: searchRadius
          },
          { status: 400 }
        );
      }
      
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

      // Map Google Places to quest objects with distance calculation
      if (googlePlaces.length > 0) {
        quests = googlePlaces.map((place, index) => {
          const quest = mapPlaceToQuest(place, index);
          // Add distance calculation
          const distance = calculateDistance(userLat, userLng, quest.lat, quest.lng);
          return {
            ...quest,
            distance_km: distance,
            distance_miles: distance * 0.621371 // Convert km to miles
          };
        });
        
        // Sort by distance (closest first)
        quests.sort((a, b) => a.distance_km - b.distance_km);
      } else {
        console.log('No Google Places found');
        quests = [];
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
      
      // Return error response - no fallback quests
      return NextResponse.json(
        { 
          error: 'Failed to fetch real places from Google Places API',
          quests: [],
          total: 0,
          location: { lat: userLat, lng: userLng },
          radius: searchRadius
        },
        { status: 500 }
      );
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
 * Calculate distance between two points using Haversine formula
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

