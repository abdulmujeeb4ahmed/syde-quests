import { QuestLocation } from './geo';
import { UserState } from './storage';

export interface Quest extends QuestLocation {
  description: string;
  duration_min: number;
  difficulty: string;
  city: string;
  cover_url?: string;
  created_at: string;
}

export interface QuestRecommendation extends Quest {
  score: number;
  distance: number;
  interestMatch: number;
  novelty: number;
}

/**
 * Calculate interest tag overlap between user preferences and quest tags
 */
function calculateInterestMatch(userInterests: string[], questTags: string[]): number {
  if (userInterests.length === 0) return 0.5; // Neutral score if no interests set
  
  const matches = questTags.filter(tag => 
    userInterests.some(interest => 
      interest.toLowerCase().includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(interest.toLowerCase())
    )
  ).length;
  
  return matches / Math.max(userInterests.length, questTags.length);
}

/**
 * Calculate novelty score based on recent completions
 */
function calculateNovelty(questId: string, completions: Record<string, any>): number {
  const completion = completions[questId];
  if (!completion) return 1.0; // Full novelty for uncompleted quests
  
  const completedAt = new Date(completion.completedAt);
  const daysSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Reduce novelty based on how recently it was completed
  if (daysSinceCompletion < 7) return 0.1;
  if (daysSinceCompletion < 30) return 0.3;
  if (daysSinceCompletion < 90) return 0.6;
  return 0.8;
}

/**
 * Calculate proximity score (closer = higher score)
 */
function calculateProximityScore(distanceKm: number, maxDistanceKm: number): number {
  if (distanceKm > maxDistanceKm) return 0;
  return Math.max(0, 1 - (distanceKm / maxDistanceKm));
}

/**
 * Generate quest recommendations based on user state and location
 */
export function generateRecommendations(
  userLocation: { lat: number; lng: number },
  quests: Quest[],
  userState: UserState,
  limit: number = 20
): QuestRecommendation[] {
  const { preferences, completions } = userState;
  const maxDistance = preferences.distanceKm;
  
  return quests
    .map(quest => {
      const distance = Math.sqrt(
        Math.pow(quest.lat - userLocation.lat, 2) + 
        Math.pow(quest.lng - userLocation.lng, 2)
      ) * 111; // Rough km conversion
      
      const proximityScore = calculateProximityScore(distance, maxDistance);
      const interestMatch = calculateInterestMatch(preferences.interests, quest.tags);
      const novelty = calculateNovelty(quest.id, completions);
      
      // Weighted scoring: proximity (40%), interest (35%), novelty (25%)
      const score = (proximityScore * 0.4) + (interestMatch * 0.35) + (novelty * 0.25);
      
      return {
        ...quest,
        score,
        distance,
        interestMatch,
        novelty,
      };
    })
    .filter(quest => quest.distance <= maxDistance)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get quests by category
 */
export function filterByCategory(quests: Quest[], category: string): Quest[] {
  if (!category) return quests;
  return quests.filter(quest => quest.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get quests by difficulty
 */
export function filterByDifficulty(quests: Quest[], difficulty: string): Quest[] {
  if (!difficulty) return quests;
  return quests.filter(quest => quest.difficulty.toLowerCase() === difficulty.toLowerCase());
}

/**
 * Get quests by duration range
 */
export function filterByDuration(quests: Quest[], maxDuration: number): Quest[] {
  if (!maxDuration) return quests;
  return quests.filter(quest => quest.duration_min <= maxDuration);
}
