'use client';

import { useState } from 'react';
import { completeQuest } from '@/lib/storage';

interface CompleteDialogProps {
  questId: string;
  questTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompleteDialog({
  questId,
  questTitle,
  isOpen,
  onClose,
  onComplete,
}: CompleteDialogProps) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('It was amazing!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      completeQuest(questId, rating, notes);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to complete quest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sq-card border border-sq-muted/20 rounded-2xl p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sq-text">Complete Quest</h2>
          <button
            onClick={onClose}
            className="text-sq-text-muted hover:text-sq-text transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-sq-text mb-2">{questTitle}</h3>
          <p className="text-sq-text-muted text-sm">
            How was your quest experience? Your feedback helps improve recommendations for other adventurers!
          </p>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-sq-text mb-3">
            Rate your experience (1-5 stars)
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-200 hover:scale-110 ${
                    isSelected
                      ? 'text-sq-accent drop-shadow-lg'
                      : 'text-sq-muted hover:text-sq-accent/50'
                  }`}
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(247, 37, 133, 0.5))' : 'none'
                  }}
                >
                  ⭐
                </button>
              );
            })}
          </div>
          <p className="text-sm text-sq-text-muted mt-2 font-medium">
            {rating === 1 && '😞 Poor'}
            {rating === 2 && '😐 Fair'}
            {rating === 3 && '😊 Good'}
            {rating === 4 && '😄 Great'}
            {rating === 5 && '🤩 Excellent'}
          </p>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-sq-text mb-2">
            Share your experience (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What made this quest special? Any tips for other adventurers?"
            className="w-full bg-sq-bg border border-sq-muted/30 rounded-lg px-3 py-2 text-sq-text focus:border-sq-primary focus:outline-none resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-sq-text-muted mt-1">
            {notes.length}/500 characters
          </p>
        </div>

        {/* Points earned */}
        <div className="bg-sq-primary/10 border border-sq-primary/20 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sq-primary">🎯</span>
            <span className="text-sm font-medium text-sq-text">
              You'll earn 50 points for completing this quest!
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Completing...' : 'Complete Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
