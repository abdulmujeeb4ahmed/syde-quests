import { NextResponse } from 'next/server';
import questData from '../../../data/quests.seed.json';
import atlantaQuests from '../../../data/quests.atlanta.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const maxDuration = searchParams.get('maxDuration');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = searchParams.get('maxDistance');

    // Determine which quest data to use based on location
    let baseQuests = questData; // Default to Toronto quests
    
    // If user is in Atlanta area, use Atlanta quests
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      // Check if user is in Atlanta area (rough coordinates)
      if (userLat >= 33.6 && userLat <= 33.9 && userLng >= -84.5 && userLng <= -84.2) {
        baseQuests = atlantaQuests;
      }
    }
    
    let filteredQuests = [...baseQuests];

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

    return NextResponse.json({
      quests: filteredQuests,
      total: filteredQuests.length,
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
