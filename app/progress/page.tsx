'use client';

import { useEffect, useState } from 'react';
import { loadState } from '@/lib/storage';
import Link from 'next/link';

interface QuestCompletion {
  completedAt: string;
  rating: number;
  notes: string;
}

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
  cover_url: string;
  created_at: string;
}

export default function Progress() {
  const [userState, setUserState] = useState(loadState());
  const [isLoading, setIsLoading] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    // Load quest data for titles
    fetch('/data/quests.seed.json')
      .then(res => res.json())
      .then(data => setQuests(data))
      .catch(() => setQuests([]))
      .finally(() => setIsLoading(false));
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

  const calculateStreak = () => {
    const completions = Object.values(userState.completions);
    if (completions.length === 0) return 0;

    const sortedDates = completions
      .map(c => new Date(c.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const completionDate = new Date(sortedDates[i]);
      completionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0 && daysDiff <= 1) {
        streak = 1;
      } else if (i > 0) {
        const prevDate = new Date(sortedDates[i - 1]);
        prevDate.setHours(0, 0, 0, 0);
        const daysBetween = Math.floor((prevDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const getQuestsPerWeek = () => {
    const completions = Object.values(userState.completions);
    if (completions.length === 0) return [];

    const weeks: Record<string, number> = {};
    
    completions.forEach(completion => {
      const date = new Date(completion.completedAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8); // Last 8 weeks
  };

  const getQuestTitle = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    return quest?.title || 'Unknown Quest';
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
  const streak = calculateStreak();
  const questsPerWeek = getQuestsPerWeek();

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
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-3xl font-bold text-sq-text">{streak}</p>
            <p className="text-sm text-sq-text-muted">Day Streak</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-3xl font-bold text-sq-text">{userState.badges.length}</p>
            <p className="text-sm text-sq-text-muted">Badges Earned</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sq-text mb-6">Your Badges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['explorer', 'adventurer', 'legend'].map((badge) => {
              const badgeInfo = getBadgeInfo(badge);
              const isEarned = userState.badges.includes(badge);
              return (
                <div key={badge} className={`card ${!isEarned ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{isEarned ? badgeInfo.emoji : '🔒'}</div>
                    <div>
                      <h3 className={`font-semibold ${isEarned ? 'text-sq-text' : 'text-sq-text-muted'}`}>
                        {badgeInfo.name}
                      </h3>
                      <p className="text-sm text-sq-text-muted">{badgeInfo.description}</p>
                      {!isEarned && (
                        <p className="text-xs text-sq-text-muted mt-1">
                          {badge === 'explorer' && `Complete ${5 - completedCount} more quests`}
                          {badge === 'adventurer' && `Complete ${10 - completedCount} more quests`}
                          {badge === 'legend' && `Complete ${25 - completedCount} more quests`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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

        {/* Chart Section */}
        {questsPerWeek.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-sq-text mb-6">Quest Activity</h2>
            <div className="card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-sq-text mb-2">Quests Completed Per Week</h3>
                <p className="text-sm text-sq-text-muted">Your quest completion activity over the last 8 weeks</p>
              </div>
              
              <div className="space-y-3">
                {questsPerWeek.map(([week, count]) => {
                  const maxCount = Math.max(...questsPerWeek.map(([, c]) => c));
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={week} className="flex items-center gap-4">
                      <div className="text-sm text-sq-text-muted w-20">
                        {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 bg-sq-muted/20 rounded-full h-6 relative">
                        <div 
                          className="bg-sq-primary rounded-full h-6 flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-medium text-white">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
                        <div className="flex-1">
                          <h3 className="font-semibold text-sq-text mb-1">
                            {getQuestTitle(questId)}
                          </h3>
                          <p className="text-sm text-sq-text-muted mb-2">
                            Completed on {new Date(completion.completedAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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
                            <div className="mt-2 p-3 bg-sq-muted/10 rounded-lg">
                              <p className="text-sm text-sq-text-muted italic">
                                "{completion.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-sq-primary">
                          +{50 + (completion.rating * 10)} pts
                        </p>
                        <p className="text-xs text-sq-text-muted">
                          {new Date(completion.completedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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
