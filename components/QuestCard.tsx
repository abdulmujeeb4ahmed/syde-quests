'use client';

import { Quest } from '@/lib/recommend';
import { formatDistance, getDistanceEmoji } from '@/lib/geo';
import Link from 'next/link';

interface QuestCardProps {
  quest: Quest;
  distance?: number;
  showDistance?: boolean;
}

export default function QuestCard({ quest, distance, showDistance = true }: QuestCardProps) {
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

  return (
    <Link href={`/quests/${quest.id}`}>
      <div className="quest-card card p-0 overflow-hidden cursor-pointer">
        {quest.cover_url && (
          <div className="relative h-48 w-full">
            <img
              src={quest.cover_url}
              alt={quest.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className={`badge ${getDifficultyColor(quest.difficulty)}`}>
                {quest.difficulty}
              </span>
            </div>
            {showDistance && distance !== undefined && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm font-medium">
                {getDistanceEmoji(distance)} {formatDistance(distance)}
              </div>
            )}
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{getCategoryEmoji(quest.category)}</span>
            <span className="text-sm text-sq-text-muted">{quest.category}</span>
          </div>
          
          <h3 className="text-xl font-bold text-sq-text mb-2 line-clamp-2">
            {quest.title}
          </h3>
          
          <p className="text-sq-text-muted text-sm mb-4 line-clamp-2">
            {quest.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-sq-text-muted">
              <span className="flex items-center gap-1">
                ⏱️ {quest.duration_min}min
              </span>
              <span className="flex items-center gap-1">
                📍 {quest.city}
              </span>
            </div>
            
            <div className="flex gap-2">
              {quest.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-sq-card border border-sq-muted/30 rounded-full px-2 py-1 text-sq-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
