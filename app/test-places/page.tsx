'use client';

import { useState, useEffect } from 'react';
import { getCurrentLocation } from '@/lib/geo';

interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country: string;
  rating?: number;
}

export default function TestPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocationAndPlaces = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current location
      const coords = await getCurrentLocation();
      setLocation(coords);
      
      // Fetch places from our API
      const response = await fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&radius=5&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlaces(data.places || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  };

  const getPlacesByCategory = async (category: string) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/places?lat=${location.lat}&lng=${location.lng}&category=${category}&radius=5&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlaces(data.places || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sq-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-sq-text mb-8">
          🗺️ Free Places API Test
        </h1>
        
        <div className="bg-sq-card rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-sq-text mb-4">
            Test OpenStreetMap Places API
          </h2>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={getCurrentLocationAndPlaces}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Get Places Near Me'}
            </button>
            
            <button
              onClick={() => getPlacesByCategory('restaurant')}
              disabled={loading || !location}
              className="btn-secondary"
            >
              Restaurants
            </button>
            
            <button
              onClick={() => getPlacesByCategory('park')}
              disabled={loading || !location}
              className="btn-secondary"
            >
              Parks
            </button>
            
            <button
              onClick={() => getPlacesByCategory('museum')}
              disabled={loading || !location}
              className="btn-secondary"
            >
              Museums
            </button>
          </div>
          
          {location && (
            <p className="text-sq-text-muted mb-4">
              📍 Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-red-400">❌ Error: {error}</p>
            </div>
          )}
        </div>
        
        <div className="grid gap-4">
          {places.map((place) => (
            <div key={place.id} className="bg-sq-card rounded-lg p-4 border border-sq-muted/20">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-sq-text">{place.name}</h3>
                <span className="badge badge-primary">{place.category}</span>
              </div>
              
              <p className="text-sq-text-muted text-sm mb-3">{place.description}</p>
              
              <div className="flex justify-between items-center text-sm text-sq-text-muted">
                <span>📍 {place.address}</span>
                {place.rating && (
                  <span>⭐ {place.rating}/5</span>
                )}
              </div>
              
              <div className="mt-2 text-xs text-sq-text-muted">
                📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
        
        {places.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-sq-text-muted">
              Click "Get Places Near Me" to discover local places using the free OpenStreetMap API!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
