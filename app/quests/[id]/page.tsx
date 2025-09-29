'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadState } from '@/lib/storage';
import { calculateDistance } from '@/lib/geo';
import MiniMap from '@/components/MiniMap';
import CompleteDialog from '@/components/CompleteDialog';
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

export default function QuestDetail() {
  const params = useParams();
  const router = useRouter();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userState, setUserState] = useState(loadState());
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const loadQuest = async () => {
      try {
        const response = await fetch(`/api/quests/${params.id}`);
        if (!response.ok) {
          router.push('/dashboard');
          return;
        }
        
        const questData = await response.json();
        setQuest(questData);

        // Calculate distance if user has location
        if (userState.preferences.homeLocation) {
          const userLoc = userState.preferences.homeLocation;
          setUserLocation({ lat: userLoc.lat, lng: userLoc.lng });
          const dist = calculateDistance(
            { lat: userLoc.lat, lng: userLoc.lng },
            { lat: questData.lat, lng: questData.lng }
          );
          setDistance(dist);
        }
      } catch (error) {
        console.error('Failed to load quest:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuest();
  }, [params.id, router, userState.preferences.homeLocation]);

  const handleComplete = () => {
    setUserState(loadState()); // Refresh state
    setShowCompleteDialog(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'badge-primary';
      case 'medium': return 'badge-accent';
      case 'hard': return 'badge-muted';
      default: return 'badge-muted';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'Culture': '🏛️',
      'Photography': '📸',
      'Art': '🎨',
      'Food': '🍽️',
      'Nature': '🌿',
      'Shopping': '🛍️',
      'Architecture': '🏗️',
      'Fitness': '💪',
      'History': '📚',
      'Music': '🎵',
    };
    return emojiMap[category] || '🎯';
  };

  const isCompleted = quest ? quest.id in userState.completions : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-gentle">🎯</div>
          <p className="text-sq-text-muted">Loading quest details...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-sq-text mb-2">Quest not found</h2>
          <p className="text-sq-text-muted mb-4">This quest might have been removed or doesn't exist.</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
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
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Dashboard
              </Link>
              <Link href="/search" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Search
              </Link>
              <Link href="/progress" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Progress
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quest Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{getCategoryEmoji(quest.category)}</span>
            <div>
              <span className="badge badge-muted">{quest.category}</span>
              <span className={`badge ml-2 ${getDifficultyColor(quest.difficulty)}`}>
                {quest.difficulty}
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-sq-text mb-4">{quest.title}</h1>
          
          <div className="flex items-center gap-6 text-sq-text-muted mb-6">
            <span className="flex items-center gap-1">
              ⏱️ {quest.duration_min} minutes
            </span>
            <span className="flex items-center gap-1">
              📍 {quest.city}
            </span>
            {distance && (
              <span className="flex items-center gap-1">
                📏 {distance.toFixed(1)}km away
              </span>
            )}
          </div>
        </div>

        {/* Quest Image */}
        {quest.cover_url && (
          <div className="mb-8">
            <img
              src={quest.cover_url}
              alt={quest.title}
              className="w-full h-64 object-cover rounded-2xl"
            />
          </div>
        )}

        {/* Quest Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-4">About this quest</h2>
          <p className="text-sq-text-muted leading-relaxed">{quest.description}</p>
        </div>

        {/* Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-4">Location</h2>
          <MiniMap
            lat={quest.lat}
            lng={quest.lng}
            title={quest.title}
            className="w-full"
          />
        </div>

        {/* Tags */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {quest.tags.map((tag, index) => (
              <span
                key={index}
                className="badge badge-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Quest Steps */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-4">Quest Steps</h2>
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sq-primary/20 rounded-full flex items-center justify-center text-sq-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-sq-text mb-1">Get to the location</h3>
                  <p className="text-sq-text-muted text-sm">
                    Navigate to the quest location using the map above
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sq-primary/20 rounded-full flex items-center justify-center text-sq-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-sq-text mb-1">Complete the quest</h3>
                  <p className="text-sq-text-muted text-sm">
                    Follow the quest description and complete all required activities
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sq-primary/20 rounded-full flex items-center justify-center text-sq-primary font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-sq-text mb-1">Mark as complete</h3>
                  <p className="text-sq-text-muted text-sm">
                    Rate your experience and share your thoughts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isCompleted ? (
            <div className="card w-full">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="font-semibold text-sq-text">Quest Completed!</h3>
                  <p className="text-sm text-sq-text-muted">
                    You completed this quest on{' '}
                    {new Date(userState.completions[quest.id].completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="btn-primary text-lg px-8 py-4"
            >
              Complete Quest
            </button>
          )}
        </div>
      </main>

      {/* Complete Dialog */}
      <CompleteDialog
        questId={quest.id}
        questTitle={quest.title}
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onComplete={handleComplete}
      />
    </div>
  );
}
