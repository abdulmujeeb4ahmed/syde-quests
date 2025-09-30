'use client';

import { useEffect, useState } from 'react';
import { loadState, cacheQuests, getCachedQuests } from '@/lib/storage';
import { getCurrentLocation } from '@/lib/geo';
import { generateRecommendations } from '@/lib/recommend';
import { reverseGeocode } from '@/lib/geocoding';
import QuestList from '@/components/QuestList';
import FiltersBar, { QuestFilters } from '@/components/FiltersBar';
import Toast from '@/components/Toast';
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

export default function Search() {
  const [userState, setUserState] = useState(loadState());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string; state: string } | null>(null);
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadSearch = async () => {
      // Small delay to ensure API is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Always get fresh current location (don't use cached data)
        let currentLocation = null;
        let locationInfo = null;
        
        try {
          console.log('Getting fresh current location for search...');
          currentLocation = await getCurrentLocation();
          locationInfo = await reverseGeocode(currentLocation.lat, currentLocation.lng);
          setUserLocation({
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            city: locationInfo.city,
            state: locationInfo.state
          });
          console.log('Got fresh location for search:', currentLocation, locationInfo);
        } catch (error) {
          console.error('Failed to get current location:', error);
          // Fallback to saved location if available
          let location = userState.preferences.homeLocation;
          if (location) {
            currentLocation = { lat: location.lat, lng: location.lng };
            locationInfo = { city: location.city, state: location.state };
            setUserLocation({ 
              lat: location.lat, 
              lng: location.lng,
              city: location.city,
              state: location.state
            });
            console.log('Using fallback saved location for search');
          }
        }

        // Check for cached quests first
        const cachedQuests = getCachedQuests();
        let quests: Quest[] = [];
        
        if (currentLocation) {
          try {
            console.log('Fetching dynamic quests from places API...', {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              city: locationInfo?.city,
              state: locationInfo?.state
            });
            
            const placesResponse = await fetch(`/api/places?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=6&limit=10`, {
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            console.log('Places API response status:', placesResponse.status);
            
            if (placesResponse.ok) {
              const placesData = await placesResponse.json();
              console.log('Places API data:', placesData);
              
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
                throw new Error('No quests returned from API');
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
              setToast({ message: 'Couldn\'t load dynamic quests, showing fallback quests instead.', type: 'error' });
            }
          }
        }
        
        // If no dynamic places found, try hardcoded quests as fallback
        if (quests.length === 0) {
          try {
            console.log('No dynamic activities found, trying hardcoded quests as fallback...', {
              currentLocation,
              locationInfo
            });
            const apiUrl = new URL('/api/quests', window.location.origin);
            if (currentLocation) {
              apiUrl.searchParams.set('lat', currentLocation.lat.toString());
              apiUrl.searchParams.set('lng', currentLocation.lng.toString());
              apiUrl.searchParams.set('maxDistance', '50');
            }
            
            console.log('Fetching from quests API:', apiUrl.toString());
            const response = await fetch(apiUrl.toString());
            console.log('Quests API response status:', response.status);
            if (response.ok) {
              const data = await response.json();
              quests = data.quests || [];
              console.log(`Fetched ${quests.length} fallback quests from API:`, quests);
            } else {
              console.error('Quests API failed with status:', response.status);
            }
          } catch (error) {
            console.error('Failed to fetch fallback quests:', error);
          }
        }
        
        if (quests.length === 0) {
          console.error('Failed to fetch quests after all retries, using fallback data');
          // Create location-aware fallback quests
          const cityName = locationInfo?.city || 'Your City';
          const stateName = locationInfo?.state || 'Your State';
          const userLat = currentLocation?.lat || 33.7606;
          const userLng = currentLocation?.lng || -84.3933;
          
          quests = [
            {
              id: 'fallback-1',
              title: `${cityName} Historic District Walk`,
              description: `Explore the charming historic district of ${cityName} with its cobblestone streets and Victorian architecture.`,
              category: 'Culture',
              duration_min: 45,
              difficulty: 'Easy',
              lat: userLat,
              lng: userLng,
              city: cityName,
              tags: ['history', 'walking', 'architecture'],
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-2',
              title: `${cityName} Photography Challenge`,
              description: `Capture the beauty of ${cityName} with different angles and compositions. Find unique perspectives of local landmarks.`,
              category: 'Photography',
              duration_min: 60,
              difficulty: 'Medium',
              lat: userLat,
              lng: userLng,
              city: cityName,
              tags: ['photography', 'local', 'landmarks'],
              created_at: new Date().toISOString()
            },
            {
              id: 'fallback-3',
              title: `${cityName} Food Discovery`,
              description: `Discover local restaurants and cafes in ${cityName}. Try different cuisines and find your new favorite spots.`,
              category: 'Food',
              duration_min: 90,
              difficulty: 'Easy',
              lat: userLat,
              lng: userLng,
              city: cityName,
              tags: ['food', 'local', 'dining'],
              created_at: new Date().toISOString()
            }
          ];
        }
        
        setAllQuests(quests);
        setFilteredQuests(quests);
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSearch();
  }, [userState.preferences.homeLocation]); // Removed userLocation from dependencies

  const handleFiltersChange = async (filters: QuestFilters) => {
    try {
      // Get current location for filtering
      let currentLat = null;
      let currentLng = null;
      
      if (userLocation) {
        currentLat = userLocation.lat;
        currentLng = userLocation.lng;
      } else {
        try {
          const location = await getCurrentLocation();
          currentLat = location.lat;
          currentLng = location.lng;
        } catch (error) {
          console.error('Failed to get current location for filters:', error);
        }
      }
      
      const params = new URLSearchParams();
      
      if (filters.category !== 'All') {
        params.append('category', filters.category);
      }
      if (filters.difficulty !== 'All') {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.maxDuration > 0) {
        params.append('maxDuration', filters.maxDuration.toString());
      }
      if (currentLat && currentLng) {
        params.append('lat', currentLat.toString());
        params.append('lng', currentLng.toString());
        params.append('maxDistance', filters.maxDistance.toString());
      }

      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch(`/api/quests?${params.toString()}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setFilteredQuests(data.quests);
          break;
        } catch (error) {
          console.error(`Failed to filter quests (${4 - retries}/3):`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Failed to filter quests:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredQuests(allQuests);
      return;
    }

    const filtered = allQuests.filter(quest =>
      quest.title.toLowerCase().includes(query.toLowerCase()) ||
      quest.description.toLowerCase().includes(query.toLowerCase()) ||
      quest.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
      quest.category.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredQuests(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-sq-text-muted">Loading quests...</p>
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
              <Link href="/dashboard" className="text-sq-text-muted hover:text-sq-text transition-colors">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-sq-text">Search Quests</h1>
                {userLocation && (
                  <p className="text-sm text-sq-text-muted">
                    Near {userLocation.city}, {userLocation.state}
                  </p>
                )}
              </div>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Dashboard
              </Link>
              <Link href="/search" className="text-sq-primary font-medium">
                Search
              </Link>
              <Link href="/progress" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Progress
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search quests, categories, or tags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-sq-card border border-sq-muted/30 rounded-2xl px-6 py-4 text-sq-text placeholder-sq-text-muted focus:border-sq-primary focus:outline-none text-lg"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sq-text-muted">
              🔍
            </div>
          </div>
        </div>

        {/* Filters */}
        <FiltersBar
          onFiltersChange={handleFiltersChange}
          userLocation={userLocation || undefined}
        />

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-sq-text">
              {filteredQuests.length} quest{filteredQuests.length !== 1 ? 's' : ''} found
            </h2>
            
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilteredQuests(allQuests);
                }}
                className="text-sq-primary hover:text-sq-accent transition-colors"
              >
                Clear search
              </button>
            )}
          </div>

          <QuestList
            quests={filteredQuests}
            userLocation={userLocation || undefined}
            showDistance={true}
          />
        </div>
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
