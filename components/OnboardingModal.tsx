'use client';

import { useState, useEffect } from 'react';
import { updatePreferences, loadState } from '@/lib/storage';
import { getCurrentLocation } from '@/lib/geo';
import { reverseGeocode, getLocationDisplayName } from '@/lib/geocoding';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const INTEREST_OPTIONS = [
  'Photography',
  'Food & Dining',
  'Art & Culture',
  'Nature & Outdoors',
  'History',
  'Architecture',
  'Fitness',
  'Music',
  'Shopping',
  'Nightlife',
];

const DISTANCE_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [distance, setDistance] = useState(10);
  const [allowNotifications, setAllowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; city: string; state: string; country: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const state = loadState();
      setInterests(state.preferences.interests);
      setDistance(state.preferences.distanceKm);
      setAllowNotifications(state.preferences.allowNotifications);
    }
  }, [isOpen]);

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();
      const locationInfo = await reverseGeocode(coords.lat, coords.lng);
      setLocation({
        lat: coords.lat,
        lng: coords.lng,
        address: locationInfo.address,
        city: locationInfo.city,
        state: locationInfo.state,
        country: locationInfo.country
      });
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    updatePreferences({
      interests,
      distanceKm: distance,
      allowNotifications,
      homeLocation: location,
    });
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sq-card border border-sq-muted/20 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-sq-text mb-2">Welcome to SydeQuests!</h1>
          <p className="text-sq-text-muted">
            Let's personalize your adventure experience
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full transition-colors ${
                  stepNum <= step ? 'bg-sq-primary' : 'bg-sq-muted/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Interests */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-sq-text mb-4">What interests you?</h2>
            <p className="text-sq-text-muted mb-6">
              Select your interests to get personalized quest recommendations
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    interests.includes(interest)
                      ? 'border-sq-primary bg-sq-primary/10 text-sq-primary'
                      : 'border-sq-muted/30 bg-sq-bg text-sq-text hover:border-sq-primary/50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-sq-text mb-4">Set your location</h2>
            <p className="text-sq-text-muted mb-6">
              Help us find quests near you
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleGetLocation}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Getting location...' : '📍 Use my current location'}
              </button>
              
              {location && (
                <div className="bg-sq-primary/10 border border-sq-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sq-primary">
                    <span>✅</span>
                    <span className="font-medium">Location set!</span>
                  </div>
                  <p className="text-sm text-sq-text-muted mt-1">
                    {getLocationDisplayName(location)}
                  </p>
                </div>
              )}
              
              <div className="text-center text-sq-text-muted text-sm">
                Don't worry, you can change this later in settings
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-sq-text mb-4">Final touches</h2>
            <p className="text-sq-text-muted mb-6">
              Set your search preferences
            </p>
            
            <div className="space-y-6">
              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-sq-text mb-3">
                  How far are you willing to travel?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DISTANCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDistance(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        distance === option.value
                          ? 'border-sq-primary bg-sq-primary/10 text-sq-primary'
                          : 'border-sq-muted/30 bg-sq-bg text-sq-text hover:border-sq-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-sq-bg rounded-lg border border-sq-muted/20">
                <div>
                  <h3 className="font-medium text-sq-text">Quest notifications</h3>
                  <p className="text-sm text-sq-text-muted">
                    Get notified about new quests and daily challenges
                  </p>
                </div>
                <button
                  onClick={() => setAllowNotifications(!allowNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    allowNotifications ? 'bg-sq-primary' : 'bg-sq-muted/30'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    allowNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary ml-auto"
              disabled={step === 2 && !location}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="btn-primary ml-auto"
            >
              Start Exploring! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
