/**
 * Form for creating or updating the patient's health profile.
 * Fields: age, weight, height, disease, extra notes. Submit POSTs to
 * /health/profile/, which also asks Groq to generate a health plan and diet.
 * On success it reports BMI via onSaved so HealthProfilePage can refresh.
 */
import { FormEvent, useState } from 'react';
import { healthApi } from '@/api/health.api';
import type { HealthProfile, HealthProfilePayload } from '@/types/health.types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatApiError } from '@/utils/format';

interface HealthProfileFormProps {
  initialProfile: HealthProfile | null;
  onSaved: (profile: HealthProfile) => void;
}

function toForm(profile: HealthProfile | null): HealthProfilePayload {
  return {
    age: profile?.age ?? undefined,
    weight: profile?.weight ?? undefined,
    height_feet: profile?.height_feet ?? undefined,
    height_inches: profile?.height_inches ?? undefined,
    disease: profile?.disease ?? '',
    addition_info: profile?.addition_info ?? '',
  };
}

function parseNumber(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function HealthProfileForm({ initialProfile, onSaved }: HealthProfileFormProps) {
  const [form, setForm] = useState<HealthProfilePayload>(() => toForm(initialProfile));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const profile = await healthApi.saveProfile(form);
      onSaved(profile);
      setSuccess('Profile saved. Health plan and dietary recommendations were generated.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Health profile"
      subtitle={
        initialProfile?.bmi
          ? `Current BMI: ${initialProfile.bmi}`
          : 'Tell us about yourself to generate personalized plans'
      }
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="grid-2">
          <Input
            label="Age"
            name="age"
            type="number"
            min={1}
            max={120}
            value={form.age ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, age: parseNumber(e.target.value) }))}
            required
          />
          <Input
            label="Weight (kg)"
            name="weight"
            type="number"
            min={1}
            step="0.1"
            value={form.weight ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, weight: parseNumber(e.target.value) }))}
            required
          />
          <Input
            label="Height (feet)"
            name="height_feet"
            type="number"
            min={1}
            step="0.1"
            value={form.height_feet ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, height_feet: parseNumber(e.target.value) }))}
            required
          />
          <Input
            label="Height (inches)"
            name="height_inches"
            type="number"
            min={0}
            step="0.1"
            value={form.height_inches ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, height_inches: parseNumber(e.target.value) }))}
            required
          />
        </div>
        <Textarea
          label="Medical conditions / diseases"
          name="disease"
          rows={3}
          value={form.disease ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, disease: e.target.value }))}
          required
        />
        <Textarea
          label="Additional information (optional)"
          name="addition_info"
          rows={3}
          value={form.addition_info ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, addition_info: e.target.value }))}
        />
        <Alert variant="error" message={error} />
        <Alert variant="success" message={success} />
        <Button type="submit" loading={loading}>Save profile</Button>
      </form>
    </Card>
  );
}
