'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState } from '@/lib/storage';
import OnboardingModal from '@/components/OnboardingModal';

export default function Home() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const state = loadState();
    const hasCompletedOnboarding = state.preferences.homeLocation !== null;
    
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  }, [router]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sq-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-sq-text-muted">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}