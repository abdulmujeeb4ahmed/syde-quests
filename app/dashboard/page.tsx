'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, saveState, cacheQuests, getCachedQuests } from '@/lib/storage';
import { getCurrentLocation } from '@/lib/geo';
import { generateRecommendations } from '@/lib/recommend';
import { getRotatedQuestOfTheDay } from '@/lib/qod';
import { reverseGeocode, getLocationDisplayName } from '@/lib/geocoding';
import Toast from '@/components/Toast';
import QuestCard from '@/components/QuestCard';
import QuestList from '@/components/QuestList';
import QuestOfTheDayCard from '@/components/QuestOfTheDayCard';
import Link from 'next/link';

interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_min: number;
  difficulty: string;
  lat: number;
  lng: number;
  city: string;
  tags: string[];
  cover_url?: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userState, setUserState] = useState(loadState());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string; state: string } | null>(null);
  const [recommendedQuests, setRecommendedQuests] = useState<Quest[]>([]);
  const [questOfTheDay, setQuestOfTheDay] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);

  // Debug userLocation state changes
  useEffect(() => {
    console.log('userLocation state changed:', userLocation);
  }, [userLocation]);

  useEffect(() => {
    // Redirect if not onboarded
    if (!userState.preferences.homeLocation) {
      router.push('/');
      return;
    }

    const loadDashboard = async () => {
      // Small delay to ensure API is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Get user location
        let currentLocation = null;
        let locationInfo = null;
        
          // Always get fresh current location (don't use cached data)
          console.log('Getting fresh current location...');
          try {
            currentLocation = await getCurrentLocation();
            console.log('Got current location:', currentLocation);
            try {
              locationInfo = await reverseGeocode(currentLocation.lat, currentLocation.lng);
              console.log('Got location info:', locationInfo);
            } catch (geocodingError) {
              console.error('Geocoding failed, using coordinates:', geocodingError);
              // Fallback to coordinate-based location
              locationInfo = {
                city: 'Your City',
                state: 'Your State',
                country: 'USA',
                address: `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
              };
            }
          
          // Save the fresh location to user state
          const updatedState = {
            ...userState,
            preferences: {
              ...userState.preferences,
              homeLocation: {
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                city: locationInfo.city,
                state: locationInfo.state,
                address: locationInfo.address,
                country: locationInfo.country
              }
            }
          };
          saveState(updatedState);
          setUserState(updatedState);
          console.log('Saved fresh location to user state');
        } catch (error) {
          console.error('Failed to get current location:', error);
          // Fallback to saved location if available
          if (userState.preferences.homeLocation) {
            console.log('Using fallback saved location');
            currentLocation = {
              lat: userState.preferences.homeLocation.lat,
              lng: userState.preferences.homeLocation.lng
            };
            locationInfo = {
              city: userState.preferences.homeLocation.city,
              state: userState.preferences.homeLocation.state
            };
          } else {
            // Use default location as last resort
            console.log('Using default location');
            currentLocation = { lat: 33.7606, lng: -84.3933 }; // Atlanta default
            locationInfo = { city: 'Atlanta', state: 'Georgia' };
          }
        }
        
        console.log('Final location data:', { currentLocation, locationInfo });

        // Set user location state
        if (currentLocation && locationInfo) {
          const newLocation = {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            city: locationInfo.city,
            state: locationInfo.state
          };
          console.log('Setting user location:', newLocation);
          setUserLocation(newLocation);
        } else {
          console.log('No location data available:', { currentLocation, locationInfo });
        }

          // Check for cached quests first
          const cachedQuests = getCachedQuests();
          let quests: Quest[] = [];
          
          if (currentLocation && !apiCallInProgress) {
            setApiCallInProgress(true);
            try {
              console.log('Fetching dynamic quests from places API...');
              
              // Create abort controller for better timeout handling
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
              
              const placesResponse = await fetch(`/api/places?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=6&limit=10`, {
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (placesResponse.ok) {
                const placesData = await placesResponse.json();
                
                // Handle the new quest format
                if (placesData.quests && placesData.quests.length > 0) {
                  quests = placesData.quests;
                  console.log(`Found ${quests.length} dynamic quests from ${placesData.source}`);
                  
                  // Cache the quests for offline use
                  cacheQuests(quests, { lat: currentLocation.lat, lng: currentLocation.lng }, placesData.source);
                  
                  // Show toast if there was an error but fallback data was used
                  if (placesData.error) {
                    setToast({ message: placesData.error, type: 'info' });
                  }
                } else {
                  console.log('No quests returned from API, will use fallback data');
                  // Don't throw error, just continue to fallback logic below
                }
              } else {
                throw new Error(`HTTP error! status: ${placesResponse.status}`);
              }
            } catch (error) {
              console.error('Failed to fetch dynamic quests:', error);
              
              // Try to use cached quests if available
              if (cachedQuests) {
                console.log('Using cached quests as fallback');
                quests = cachedQuests.quests;
                setToast({ message: 'Using cached quests (offline mode)', type: 'info' });
              } else {
                console.log('No cached quests available, will use hardcoded fallback');
                setToast({ message: 'Couldn\'t load dynamic quests, showing fallback quests instead.', type: 'error' });
              }
            } finally {
              setApiCallInProgress(false);
            }
          }
        
        // If no dynamic places found, try hardcoded quests as fallback
        if (quests.length === 0) {
          try {
            console.log('No dynamic activities found, trying hardcoded quests as fallback...');
            const apiUrl = new URL('/api/quests', window.location.origin);
            if (currentLocation) {
              apiUrl.searchParams.set('lat', currentLocation.lat.toString());
              apiUrl.searchParams.set('lng', currentLocation.lng.toString());
              apiUrl.searchParams.set('maxDistance', '50');
            }
            
              const response = await fetch(apiUrl.toString(), {
                signal: AbortSignal.timeout(5000) // 5 second timeout
              });
              if (response.ok) {
                const data = await response.json();
                quests = data.quests || [];
                console.log(`Fetched ${quests.length} fallback quests from API`);
              }
          } catch (error) {
            console.error('Failed to fetch fallback quests:', error);
          }
        }
        
        if (quests.length === 0) {
          console.log('No quests found, creating location-based fallback quests');
          // Create location-aware fallback quests
          const cityName = locationInfo?.city || 'Your City';
          const stateName = locationInfo?.state || 'Your State';
          
          quests = [
            {
              id: 'fallback-1',
              title: `${cityName} Historic District Walk`,
              description: `Explore the charming historic district of ${cityName} with its unique architecture and local landmarks.`,
              category: 'Culture',
              duration_min: 45,
              difficulty: 'Easy',
              lat: currentLocation?.lat || 33.7606,
              lng: currentLocation?.lng || -84.3933,
              city: cityName,
              tags: ['history', 'walking', 'architecture'],
              created_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 'fallback-2',
              title: `${cityName} Photography Challenge`,
              description: `Capture the perfect shots around ${cityName} with different angles and compositions.`,
              category: 'Photography',
              duration_min: 60,
              difficulty: 'Medium',
              lat: currentLocation?.lat || 33.7606,
              lng: currentLocation?.lng || -84.3933,
              city: cityName,
              tags: ['photography', 'local', 'exploration'],
              created_at: '2024-01-15T10:00:00Z'
            }
          ];
        }

        // Show all available quests as recommendations (up to 6)
        const recommendations = quests.slice(0, 6);
        setRecommendedQuests(recommendations);
        console.log(`Setting ${recommendations.length} recommended quests`);

        // Get quest of the day using the last 7 days tracking
        const qod = getRotatedQuestOfTheDay(
          quests,
          userState.preferences.homeLocation ? 'device-id' : 'default',
          userState.last7DaysQOD || []
        );
        setQuestOfTheDay(qod);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [userState.preferences.homeLocation, router]); // Removed userLocation from dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-sq-text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sq-bg">
      {/* Header */}
      <header className="bg-sq-card border-b border-sq-muted/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎯</div>
              <h1 className="text-xl font-bold text-sq-text">SydeQuests</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link href="/dashboard" className="text-sq-primary font-medium">
                  Dashboard
                </Link>
                <Link href="/search" className="text-sq-text-muted hover:text-sq-text transition-colors">
                  Search
                </Link>
                <Link href="/progress" className="text-sq-text-muted hover:text-sq-text transition-colors">
                  Progress
                </Link>
              </nav>
              {userLocation && (
                <div className="flex items-center gap-2 text-sm text-sq-primary">
                  <span className="text-sq-accent">📍</span>
                  <span>{userLocation.city}, {userLocation.state}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-sq-text mb-2">
                Welcome back, Adventurer! 🚀
              </h2>
              <p className="text-sq-text-muted">
                Discover new quests and continue your journey
                {userLocation && (
                  <span className="ml-2 text-sq-primary">
                    • {userLocation.city}, {userLocation.state}
                  </span>
                )}
              </p>
              {userLocation ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-sq-text-muted">
                  <span className="text-sq-accent">📍</span>
                  <span>Current Location: {userLocation.city}, {userLocation.state}</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-sm text-sq-text-muted">
                  <span className="text-sq-accent">📍</span>
                  <span>Detecting your location...</span>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  // Clear saved location and get fresh one
                  const newLocation = await getCurrentLocation();
                  const newLocationInfo = await reverseGeocode(newLocation.lat, newLocation.lng);
                  
                  // Update user state with new location
                  const updatedState = {
                    ...userState,
                    preferences: {
                      ...userState.preferences,
                      homeLocation: {
                        lat: newLocation.lat,
                        lng: newLocation.lng,
                        city: newLocationInfo.city,
                        state: newLocationInfo.state,
                        address: newLocationInfo.address,
                        country: newLocationInfo.country
                      }
                    }
                  };
                  
                  saveState(updatedState);
                  setUserState(updatedState);
                  
                  // Reload the page to refresh everything
                  window.location.reload();
                } catch (error) {
                  console.error('Failed to refresh location:', error);
                  alert('Failed to get your location. Please check your browser permissions.');
                }
              }}
              className="btn-secondary text-sm"
            >
              🔄 Refresh Location
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎯</div>
              <div>
                <p className="text-2xl font-bold text-sq-text">{userState.points}</p>
                <p className="text-sm text-sq-text-muted">Points earned</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="text-2xl font-bold text-sq-text">{Object.keys(userState.completions).length}</p>
                <p className="text-sm text-sq-text-muted">Quests completed</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏅</div>
              <div>
                <p className="text-2xl font-bold text-sq-text">{userState.badges.length}</p>
                <p className="text-sm text-sq-text-muted">Badges earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quest of the Day */}
        {questOfTheDay && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-3xl font-bold text-sq-text">Quest of the Day</h3>
              <span className="badge badge-accent text-sm px-3 py-1">Featured</span>
            </div>
            <div className="max-w-2xl">
              <QuestOfTheDayCard 
                quest={questOfTheDay} 
                showDistance={false}
                onComplete={() => {
                  // Update the last 7 days QOD tracking
                  const updatedState = {
                    ...userState,
                    last7DaysQOD: [questOfTheDay.id, ...(userState.last7DaysQOD || [])].slice(0, 7)
                  };
                  saveState(updatedState);
                  setUserState(updatedState);
                }}
              />
            </div>
          </div>
        )}

        {/* Recommended Quests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-sq-text">Activities Near You</h3>
            <Link 
              href="/search" 
              className="text-sq-primary hover:text-sq-accent transition-colors"
            >
              View all →
            </Link>
          </div>
          
          {recommendedQuests.length > 0 ? (
            <QuestList 
              quests={recommendedQuests} 
              userLocation={userLocation || undefined}
              showDistance={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-sq-text mb-2">No recommendations yet</h3>
              <p className="text-sq-text-muted mb-4">
                Complete your first quest to get personalized recommendations!
              </p>
              <Link href="/search" className="btn-primary">
                Explore Quests
              </Link>
            </div>
          )}
        </div>

        {/* Recent Completions */}
        {Object.keys(userState.completions).length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-sq-text mb-6">Recent Adventures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(userState.completions)
                .slice(-3)
                .map(([questId, completion]) => (
                  <div key={questId} className="card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">✅</div>
                      <div>
                        <p className="font-medium text-sq-text">Quest Completed</p>
                        <p className="text-sm text-sq-text-muted">
                          {new Date(completion.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < completion.rating ? 'text-sq-accent' : 'text-sq-muted/30'
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    {completion.notes && (
                      <p className="text-sm text-sq-text-muted italic">
                        "{completion.notes}"
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
