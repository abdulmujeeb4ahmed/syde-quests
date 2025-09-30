'use client';

import { useEffect, useState } from 'react';
import { loadState } from '@/lib/storage';
import Link from 'next/link';

interface QuestCompletion {
  completedAt: string;
  rating: number;
  notes: string;
}

export default function Progress() {
  const [userState, setUserState] = useState(loadState());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getBadgeInfo = (badge: string) => {
    const badgeMap: Record<string, { emoji: string; name: string; description: string }> = {
      'explorer': { emoji: '🗺️', name: 'Explorer', description: 'Completed 5 quests' },
      'adventurer': { emoji: '🏔️', name: 'Adventurer', description: 'Completed 10 quests' },
      'legend': { emoji: '👑', name: 'Legend', description: 'Completed 25 quests' },
    };
    return badgeMap[badge] || { emoji: '🏆', name: badge, description: 'Achievement unlocked' };
  };

  const getNextMilestone = () => {
    const completedCount = Object.keys(userState.completions).length;
    if (completedCount < 5) return { target: 5, badge: 'Explorer', emoji: '🗺️' };
    if (completedCount < 10) return { target: 10, badge: 'Adventurer', emoji: '🏔️' };
    if (completedCount < 25) return { target: 25, badge: 'Legend', emoji: '👑' };
    return null;
  };

  const getTotalDistance = () => {
    // This would require storing distance data, for now return a placeholder
    return 0;
  };

  const getFavoriteCategory = () => {
    const categoryCount: Record<string, number> = {};
    // This would require storing category data with completions
    return 'Adventure';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-sq-text-muted">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const completedCount = Object.keys(userState.completions).length;
  const nextMilestone = getNextMilestone();

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
              <h1 className="text-xl font-bold text-sq-text">Your Progress</h1>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Dashboard
              </Link>
              <Link href="/search" className="text-sq-text-muted hover:text-sq-text transition-colors">
                Search
              </Link>
              <Link href="/progress" className="text-sq-primary font-medium">
                Progress
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-3xl font-bold text-sq-text">{userState.points}</p>
            <p className="text-sm text-sq-text-muted">Total Points</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-3xl font-bold text-sq-text">{completedCount}</p>
            <p className="text-sm text-sq-text-muted">Quests Completed</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-3xl font-bold text-sq-text">{userState.badges.length}</p>
            <p className="text-sm text-sq-text-muted">Badges Earned</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-3xl font-bold text-sq-text">
              {completedCount > 0 ? Math.round(userState.points / completedCount) : 0}
            </p>
            <p className="text-sm text-sq-text-muted">Avg Points/Quest</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-6">Your Badges</h2>
          
          {userState.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userState.badges.map((badge, index) => {
                const badgeInfo = getBadgeInfo(badge);
                return (
                  <div key={index} className="card">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{badgeInfo.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-sq-text">{badgeInfo.name}</h3>
                        <p className="text-sm text-sq-text-muted">{badgeInfo.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏅</div>
              <h3 className="text-xl font-semibold text-sq-text mb-2">No badges yet</h3>
              <p className="text-sq-text-muted mb-4">
                Complete your first quest to earn your first badge!
              </p>
              <Link href="/search" className="btn-primary">
                Find Quests
              </Link>
            </div>
          )}

          {/* Next Milestone */}
          {nextMilestone && (
            <div className="mt-6 card bg-sq-primary/10 border border-sq-primary/20">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{nextMilestone.emoji}</div>
                <div>
                  <h3 className="font-semibold text-sq-text">Next Milestone: {nextMilestone.badge}</h3>
                  <p className="text-sm text-sq-text-muted">
                    Complete {nextMilestone.target - completedCount} more quest{nextMilestone.target - completedCount !== 1 ? 's' : ''} to earn this badge
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quest History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-6">Quest History</h2>
          
          {completedCount > 0 ? (
            <div className="space-y-4">
              {Object.entries(userState.completions)
                .sort(([, a], [, b]) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map(([questId, completion]) => (
                  <div key={questId} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">✅</div>
                        <div>
                          <h3 className="font-semibold text-sq-text mb-1">Quest Completed</h3>
                          <p className="text-sm text-sq-text-muted mb-2">
                            Completed on {new Date(completion.completedAt).toLocaleDateString()}
                          </p>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-2">
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
                            <span className="text-sm text-sq-text-muted ml-2">
                              {completion.rating}/5
                            </span>
                          </div>
                          
                          {/* Notes */}
                          {completion.notes && (
                            <p className="text-sm text-sq-text-muted italic">
                              "{completion.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-sq-primary">
                          +{50 + (completion.rating * 10)} pts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-sq-text mb-2">No quests completed yet</h3>
              <p className="text-sq-text-muted mb-4">
                Start your adventure by completing your first quest!
              </p>
              <Link href="/search" className="btn-primary">
                Find Your First Quest
              </Link>
            </div>
          )}
        </div>

        {/* Achievements Summary */}
        <div className="card bg-sq-accent/10 border border-sq-accent/20">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-sq-text mb-2">Adventure Summary</h3>
            <p className="text-sq-text-muted mb-4">
              You've completed {completedCount} quest{completedCount !== 1 ? 's' : ''} and earned {userState.points} points!
            </p>
            <p className="text-sm text-sq-text-muted">
              Keep exploring to unlock more badges and discover new adventures!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
