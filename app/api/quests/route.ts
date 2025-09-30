import { NextResponse } from 'next/server';
import questData from '../../../data/quests.seed.json';
import atlantaQuests from '../../../data/quests.atlanta.json';
import { searchPlaces, Place } from '../../../lib/places-api';

// Simple in-memory cache to prevent excessive API calls
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Convert places to quests
function convertPlacesToQuests(places: Place[]): any[] {
  return places.map((place, index) => {
    // Create deterministic values based on place ID to avoid changing on each call
    const hash = place.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const durationOptions = [45, 60, 90, 120, 150];
    const difficultyOptions = ['Easy', 'Medium', 'Hard'];
    
    return {
      id: `dynamic-${place.id}`,
      title: `${place.name} Discovery`,
      description: place.description,
      category: place.category,
      duration_min: durationOptions[Math.abs(hash) % durationOptions.length],
      difficulty: difficultyOptions[Math.abs(hash) % difficultyOptions.length],
      lat: place.lat,
      lng: place.lng,
      city: place.city,
      tags: [place.category.toLowerCase(), 'local', 'discovery'],
      cover_url: undefined, // Remove random images
      created_at: new Date().toISOString()
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const maxDuration = searchParams.get('maxDuration');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = searchParams.get('maxDistance');

    // Create cache key
    const cacheKey = `quests-${lat}-${lng}-${category}-${difficulty}-${maxDuration}-${maxDistance}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('API: Returning cached quests');
      return NextResponse.json(cached.data);
    }

    // Determine which quest data to use based on location
    let baseQuests = questData; // Default to Toronto quests
    let useDynamicPlaces = false;
    
    // If user is in Atlanta area, use Atlanta quests
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      console.log(`API: User location ${userLat}, ${userLng}`);
      
      // Check if user is in Atlanta area (rough coordinates)
      if (userLat >= 33.6 && userLat <= 34.0 && userLng >= -84.5 && userLng <= -84.1) {
        console.log('API: Using Atlanta quests');
        baseQuests = atlantaQuests;
      } else {
        // For other locations, try to get dynamic places
        console.log('API: Using dynamic places for location outside Atlanta');
        useDynamicPlaces = true;
      }
    }
    
    let filteredQuests = [...baseQuests];
    
    // If we should use dynamic places, fetch them
    if (useDynamicPlaces && lat && lng) {
      try {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const places = await searchPlaces({
          lat: userLat,
          lng: userLng,
          radius: 10,
          limit: 20
        });
        
        if (places.length > 0) {
          const dynamicQuests = convertPlacesToQuests(places);
          // For unknown locations, prioritize dynamic places over hardcoded ones
          filteredQuests = [...dynamicQuests, ...baseQuests.slice(0, 5)]; // Keep a few hardcoded as fallback
          console.log(`API: Using ${dynamicQuests.length} dynamic quests for location ${userLat}, ${userLng}`);
        } else {
          console.log('API: No dynamic places found, using hardcoded quests');
        }
      } catch (error) {
        console.error('Failed to fetch dynamic places:', error);
        // Continue with hardcoded data
      }
    }

    // Filter by category
    if (category) {
      filteredQuests = filteredQuests.filter(
        quest => quest.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by difficulty
    if (difficulty) {
      filteredQuests = filteredQuests.filter(
        quest => quest.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Filter by duration
    if (maxDuration) {
      const duration = parseInt(maxDuration);
      filteredQuests = filteredQuests.filter(
        quest => quest.duration_min <= duration
      );
    }

    // Filter by distance if location provided
    if (lat && lng && maxDistance) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxDist = parseFloat(maxDistance);

      filteredQuests = filteredQuests.filter(quest => {
        const distance = Math.sqrt(
          Math.pow(quest.lat - userLat, 2) + 
          Math.pow(quest.lng - userLng, 2)
        ) * 111; // Rough km conversion
        return distance <= maxDist;
      });
    }

    const responseData = {
      quests: filteredQuests,
      total: filteredQuests.length,
    };

    // Cache the response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
