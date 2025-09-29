import { NextResponse } from 'next/server';
import { searchPlaces, getPlacesByCategory, getPopularPlaces } from '../../../lib/places-api';

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

      return NextResponse.json({
        places,
        total: places.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius
      });

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

      return NextResponse.json({
        places: fallbackPlaces,
        total: fallbackPlaces.length,
        location: { lat: userLat, lng: userLng },
        radius: searchRadius,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Error in places API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
