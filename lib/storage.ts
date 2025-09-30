import { v4 as uuidv4 } from 'uuid';
import { QuestObject } from './google-places-api';

export interface UserPreferences {
  homeLocation: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    country: string;
  } | null;
  interests: string[];
  distanceKm: number;
  allowNotifications: boolean;
}

export interface QuestCompletion {
  completedAt: string;
  rating: number;
  notes: string;
}

export interface UserState {
  preferences: UserPreferences;
  completions: Record<string, QuestCompletion>;
  badges: string[];
  points: number;
  lastSeenQuestOfDay: string | null;
  last7DaysQOD: string[];
}

const DEFAULT_STATE: UserState = {
  preferences: {
    homeLocation: null,
    interests: [],
    distanceKm: 10,
    allowNotifications: false,
  },
  completions: {},
  badges: [],
  points: 0,
  lastSeenQuestOfDay: null,
  last7DaysQOD: [],
};

const DEVICE_ID_KEY = 'syde_quests_device_id';
const STATE_KEY = 'syde_quests_state';
const CACHED_QUESTS_KEY = 'syde_quests_cached';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function loadState(): UserState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (!stored) return DEFAULT_STATE;
    
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: {
        ...DEFAULT_STATE.preferences,
        ...parsed.preferences,
      },
    };
  } catch (error) {
    console.error('Failed to load state:', error);
    return DEFAULT_STATE;
  }
}

export function saveState(state: UserState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function updatePreferences(updates: Partial<UserPreferences>): void {
  const state = loadState();
  state.preferences = { ...state.preferences, ...updates };
  saveState(state);
}

export function completeQuest(questId: string, rating: number, notes: string): void {
  const state = loadState();
  state.completions[questId] = {
    completedAt: new Date().toISOString(),
    rating,
    notes,
  };
  
  // Award fixed points for completion
  const points = 50;
  state.points += points;
  
  // Check for badge milestones
  const completedCount = Object.keys(state.completions).length;
  const newBadges: string[] = [];
  
  if (completedCount >= 5 && !state.badges.includes('explorer')) {
    newBadges.push('explorer');
  }
  if (completedCount >= 10 && !state.badges.includes('adventurer')) {
    newBadges.push('adventurer');
  }
  if (completedCount >= 25 && !state.badges.includes('legend')) {
    newBadges.push('legend');
  }
  
  state.badges = [...state.badges, ...newBadges];
  saveState(state);
}

export function setLastSeenQuestOfDay(questId: string): void {
  const state = loadState();
  state.lastSeenQuestOfDay = questId;
  saveState(state);
}

export function updateLast7DaysQOD(questId: string): void {
  const state = loadState();
  
  // Add the new quest ID to the beginning of the array
  const updatedLast7Days = [questId, ...state.last7DaysQOD];
  
  // Keep only the last 7 entries
  state.last7DaysQOD = updatedLast7Days.slice(0, 7);
  
  // Also update the legacy lastSeenQuestOfDay for backward compatibility
  state.lastSeenQuestOfDay = questId;
  
  saveState(state);
}

export interface CachedQuestsData {
  quests: QuestObject[];
  location: { lat: number; lng: number };
  timestamp: number;
  source: string;
}

/**
 * Cache quests data in localStorage for offline use
 */
export function cacheQuests(quests: QuestObject[], location: { lat: number; lng: number }, source: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cachedData: CachedQuestsData = {
      quests,
      location,
      timestamp: Date.now(),
      source
    };
    
    localStorage.setItem(CACHED_QUESTS_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Failed to cache quests:', error);
  }
}

/**
 * Get cached quests data from localStorage
 */
export function getCachedQuests(): CachedQuestsData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHED_QUESTS_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    
    // Check if cache is still valid (24 hours)
    const CACHE_DURATION = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHED_QUESTS_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load cached quests:', error);
    return null;
  }
}

/**
 * Clear cached quests data
 */
export function clearCachedQuests(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CACHED_QUESTS_KEY);
  } catch (error) {
    console.error('Failed to clear cached quests:', error);
  }
}
