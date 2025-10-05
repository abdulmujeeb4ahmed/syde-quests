'use client';

import { Quest } from '@/lib/recommend';
import QuestCard from './QuestCard';

interface QuestListProps {
  quests: Quest[];
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number };
}

export default function QuestList({ quests, showDistance = true, userLocation }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-sq-text mb-2">No quests found</h3>
        <p className="text-sq-text-muted">
          Try adjusting your filters or expanding your search area.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quests.map((quest) => {
        // Use distance from API if available, otherwise calculate it
        let distance: number | undefined;
        
        if (showDistance) {
          // First try to use distance from API (for real places)
          if ((quest as any).distance_km !== undefined) {
            distance = (quest as any).distance_km;
          } else if (userLocation) {
            // Fallback to calculating distance for hardcoded quests
            const R = 6371; // Earth's radius in kilometers
            const dLat = (quest.lat - userLocation.lat) * Math.PI / 180;
            const dLng = (quest.lng - userLocation.lng) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(quest.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance = R * c;
          }
        }

        return (
          <QuestCard
            key={quest.id}
            quest={quest}
            distance={distance}
            showDistance={showDistance}
          />
        );
      })}
    </div>
  );
}
