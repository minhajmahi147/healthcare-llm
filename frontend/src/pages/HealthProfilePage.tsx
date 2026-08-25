/**
 * /health-profile page. Fetches the current profile with useAsync + healthApi.getProfile()
 * (spinner while loading). Then renders HealthProfileForm so the user can edit
 * age/weight/height/conditions. Saving updates local state and refetches from the API.
 * This profile is what Groq uses to generate plan and diet.
 */
import { useState } from 'react';
import { healthApi } from '@/api/health.api';
import type { HealthProfile } from '@/types/health.types';
import { HealthProfileForm } from '@/features/health/HealthProfileForm';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAsync } from '@/hooks/useAsync';

export function HealthProfilePage() {
  const { data, error, loading, refetch } = useAsync(() => healthApi.getProfile(), []);
  const [profile, setProfile] = useState<HealthProfile | null>(null);

  const currentProfile = profile ?? data;

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Health Profile</h1>
        <p>Your profile drives personalized health and dietary recommendations.</p>
      </header>
      <Alert variant="error" message={error ?? ''} />
      <HealthProfileForm
        initialProfile={currentProfile}
        onSaved={(saved) => {
          setProfile(saved);
          void refetch();
        }}
      />
    </div>
  );
}
