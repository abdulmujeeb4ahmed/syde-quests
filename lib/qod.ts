import { Quest } from './recommend';
import { getDeviceId } from './storage';

/**
 * Generate a deterministic hash from a string
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get quest of the day based on date and device ID
 */
export function getQuestOfTheDay(quests: Quest[], deviceId: string): Quest | null {
  if (quests.length === 0) return null;
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = `${today}-${deviceId}`;
  const hash = simpleHash(seed);
  
  // Use hash to select quest
  const index = hash % quests.length;
  return quests[index];
}

/**
 * Get quest of the day with rotation logic to avoid recent selections
 */
export function getRotatedQuestOfTheDay(
  quests: Quest[], 
  deviceId: string, 
  lastSeenQuestId: string | null
): Quest | null {
  if (quests.length === 0) return null;
  
  // Filter out the last seen quest if it exists
  const availableQuests = lastSeenQuestId 
    ? quests.filter(q => q.id !== lastSeenQuestId)
    : quests;
  
  if (availableQuests.length === 0) {
    // Fallback to all quests if filtering removes everything
    return getQuestOfTheDay(quests, deviceId);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const seed = `${today}-${deviceId}`;
  const hash = simpleHash(seed);
  
  const index = hash % availableQuests.length;
  return availableQuests[index];
}

/**
 * Get quest of the day for a specific date (useful for testing)
 */
export function getQuestOfTheDayForDate(
  quests: Quest[], 
  deviceId: string, 
  date: string
): Quest | null {
  if (quests.length === 0) return null;
  
  const seed = `${date}-${deviceId}`;
  const hash = simpleHash(seed);
  const index = hash % quests.length;
  return quests[index];
}

/**
 * Get the next 7 days of quests (for preview)
 */
export function getNextWeekQuests(quests: Quest[], deviceId: string): Quest[] {
  const nextWeek: Quest[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const quest = getQuestOfTheDayForDate(quests, deviceId, dateStr);
    if (quest) {
      nextWeek.push(quest);
    }
  }
  
  return nextWeek;
}
