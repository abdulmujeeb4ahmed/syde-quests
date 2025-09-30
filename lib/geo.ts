export interface Location {
  lat: number;
  lng: number;
}

export interface QuestLocation extends Location {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First location
 * @param point2 Second location
 * @returns Distance in miles
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using HTML5 Geolocation API
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Find quests within specified distance from a location
 */
export function findNearbyQuests(
  userLocation: Location,
  quests: QuestLocation[],
  maxDistanceMiles: number
): QuestLocation[] {
  return quests
    .map(quest => ({
      ...quest,
      distance: calculateDistance(userLocation, quest),
    }))
    .filter(quest => quest.distance <= maxDistanceMiles)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)}ft`;
  }
  return `${miles.toFixed(1)}mi`;
}

/**
 * Get distance-based emoji for quest cards
 */
export function getDistanceEmoji(miles: number): string {
  if (miles < 0.3) return '🦶';
  if (miles < 1.2) return '🚶';
  if (miles < 3) return '🚴';
  if (miles < 9) return '🚗';
  return '✈️';
}
