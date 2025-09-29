'use client';

import { useEffect, useState } from 'react';
import { loadState } from '@/lib/storage';
import { getCurrentLocation } from '@/lib/geo';
import { generateRecommendations } from '@/lib/recommend';
import { reverseGeocode } from '@/lib/geocoding';
import QuestList from '@/components/QuestList';
import FiltersBar, { QuestFilters } from '@/components/FiltersBar';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadSearch = async () => {
      try {
        // Get user location
        let location = userState.preferences.homeLocation;
        if (location) {
          setUserLocation({ 
            lat: location.lat, 
            lng: location.lng,
            city: location.city,
            state: location.state
          });
        } else {
          try {
            const currentLocation = await getCurrentLocation();
            const locationInfo = await reverseGeocode(currentLocation.lat, currentLocation.lng);
            setUserLocation({
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              city: locationInfo.city,
              state: locationInfo.state
            });
          } catch (error) {
            console.error('Failed to get current location:', error);
          }
        }

        // Fetch all quests
        const response = await fetch('/api/quests');
        const data = await response.json();
        setAllQuests(data.quests);
        setFilteredQuests(data.quests);
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSearch();
  }, [userState.preferences.homeLocation]);

  const handleFiltersChange = async (filters: QuestFilters) => {
    try {
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
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('maxDistance', filters.maxDistance.toString());
      }

      const response = await fetch(`/api/quests?${params.toString()}`);
      const data = await response.json();
      setFilteredQuests(data.quests);
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
          <div className="text-6xl mb-4 animate-pulse-gentle">🔍</div>
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
    </div>
  );
}
