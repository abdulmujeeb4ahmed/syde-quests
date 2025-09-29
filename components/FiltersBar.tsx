'use client';

import { useState } from 'react';

interface FiltersBarProps {
  onFiltersChange: (filters: QuestFilters) => void;
  userLocation?: { lat: number; lng: number };
}

export interface QuestFilters {
  category: string;
  difficulty: string;
  maxDuration: number;
  maxDistance: number;
}

const CATEGORIES = [
  'All',
  'Culture',
  'Photography',
  'Art',
  'Food',
  'Nature',
  'Shopping',
  'Architecture',
  'Fitness',
  'History',
  'Music',
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const DURATION_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4+ hours', value: 300 },
];

const DISTANCE_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

export default function FiltersBar({ onFiltersChange, userLocation }: FiltersBarProps) {
  const [filters, setFilters] = useState<QuestFilters>({
    category: 'All',
    difficulty: 'All',
    maxDuration: 0,
    maxDistance: 10,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof QuestFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: QuestFilters = {
      category: 'All',
      difficulty: 'All',
      maxDuration: 0,
      maxDistance: 10,
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.category !== 'All' ||
    filters.difficulty !== 'All' ||
    filters.maxDuration > 0;

  return (
    <div className="bg-sq-card border border-sq-muted/20 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sq-text">Filters</h3>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-sq-primary hover:text-sq-accent transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-sq-text-muted hover:text-sq-text transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-sq-text mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full bg-sq-bg border border-sq-muted/30 rounded-lg px-3 py-2 text-sq-text focus:border-sq-primary focus:outline-none"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-sq-text mb-2">Difficulty</label>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="w-full bg-sq-bg border border-sq-muted/30 rounded-lg px-3 py-2 text-sq-text focus:border-sq-primary focus:outline-none"
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>

        {/* Distance Filter */}
        {userLocation && (
          <div>
            <label className="block text-sm font-medium text-sq-text mb-2">Distance</label>
            <select
              value={filters.maxDistance}
              onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
              className="w-full bg-sq-bg border border-sq-muted/30 rounded-lg px-3 py-2 text-sq-text focus:border-sq-primary focus:outline-none"
            >
              {DISTANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duration Filter */}
        {isExpanded && (
          <div>
            <label className="block text-sm font-medium text-sq-text mb-2">Max Duration</label>
            <select
              value={filters.maxDuration}
              onChange={(e) => handleFilterChange('maxDuration', parseInt(e.target.value))}
              className="w-full bg-sq-bg border border-sq-muted/30 rounded-lg px-3 py-2 text-sq-text focus:border-sq-primary focus:outline-none"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-sq-muted/20">
          <div className="flex flex-wrap gap-2">
            {filters.category !== 'All' && (
              <span className="badge badge-primary">
                {filters.category}
              </span>
            )}
            {filters.difficulty !== 'All' && (
              <span className="badge badge-accent">
                {filters.difficulty}
              </span>
            )}
            {filters.maxDuration > 0 && (
              <span className="badge badge-muted">
                Max {filters.maxDuration}min
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
