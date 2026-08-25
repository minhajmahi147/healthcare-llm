/**
 * TypeScript shapes for the health feature, matching the Django /api/health/ JSON.
 * HealthProfile is what GET/POST profile returns (including computed BMI).
 * HealthProfilePayload is the form fields sent on save.
 * HealthPlan and DietaryRecommendation are the generated plan and meal objects.
 */
export interface HealthProfile {
  age: number | null;
  weight?: number | null;
  height_feet?: number | null;
  height_inches?: number | null;
  disease?: string | null;
  addition_info?: string | null;
  bmi: number | null;
  created?: boolean;
}

export interface HealthProfilePayload {
  age?: number;
  weight?: number;
  height_feet?: number;
  height_inches?: number;
  disease?: string;
  addition_info?: string;
}

export interface HealthPlan {
  food_chart: string;
  exercise_plan: string;
  sleep_plan: string;
  generated_at: string;
}

export interface DietaryRecommendation {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  foods_to_avoid: string;
  created_at: string;
}
