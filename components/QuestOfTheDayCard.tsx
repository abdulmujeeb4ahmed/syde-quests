'use client';

import { Quest } from '@/lib/recommend';
import { formatDistance, getDistanceEmoji } from '@/lib/geo';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface QuestOfTheDayCardProps {
  quest: Quest;
  distance?: number;
  showDistance?: boolean;
  onComplete?: () => void;
}

export default function QuestOfTheDayCard({ 
  quest, 
  distance, 
  showDistance = true, 
  onComplete 
}: QuestOfTheDayCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    setShowConfetti(true);
    onComplete?.();
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Link href={`/quests/${quest.id}`}>
        <div className={`
          quest-of-the-day-card 
          relative overflow-hidden cursor-pointer
          bg-gradient-to-br from-sq-primary/10 via-sq-accent/5 to-sq-primary/10
          border-2 border-sq-primary/20
          rounded-2xl shadow-2xl
          transform transition-all duration-300 hover:scale-105 hover:shadow-3xl
          ${isCompleted ? 'animate-pulse-glow' : ''}
        `}>
          {/* Pulse Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-sq-primary/20 via-sq-accent/20 to-sq-primary/20 opacity-0 animate-pulse-glow" />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-sq-accent text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              <span className="text-lg">⭐</span>
              <span>Quest of the Day</span>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`badge ${getDifficultyColor(quest.difficulty)} shadow-lg`}>
              {quest.difficulty}
            </span>
          </div>

          {/* Distance Badge */}
          {showDistance && distance !== undefined && (
            <div className="absolute top-16 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm font-medium shadow-lg">
              {getDistanceEmoji(distance)} {formatDistance(distance)}
            </div>
          )}

          {/* Cover Image */}
          {quest.cover_url && (
            <div className="relative h-64 w-full">
              <img
                src={quest.cover_url}
                alt={quest.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-sq-text mb-2 leading-tight">
                  {quest.title}
                </h3>
                <p className="text-sq-text-muted text-base leading-relaxed">
                  {quest.description}
                </p>
              </div>
            </div>

            {/* Quest Details */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm text-sq-text-muted">
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{quest.duration_min} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{quest.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🏷️</span>
                  <span>{quest.category}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quest.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-sq-primary/10 text-sq-primary text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between">
              <div className="text-sq-accent font-semibold text-lg">
                Start Your Adventure →
              </div>
              {!isCompleted && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleComplete();
                  }}
                  className="btn-accent text-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Mark Complete
                </button>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 text-sq-accent font-bold">
                  <span className="text-2xl">🎉</span>
                  <span>Completed!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
