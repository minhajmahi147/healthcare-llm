/**
 * Types for staff admin patient APIs.
 */
export interface AdminPatientSummary {
  patient_id: number;
  name: string;
  email: string | null;
  username: string | null;
  age: number | null;
  bmi: number | null;
  disease: string | null;
  has_health_plan: boolean;
  has_dietary_plan: boolean;
}

export interface AdminPatientDetail {
  patient: {
    patient_id: number;
    name: string;
    email: string | null;
    username: string | null;
  };
  health_profile: {
    age: number;
    weight: number;
    height_feet: number;
    height_inches: number;
    bmi: number | null;
    disease: string;
    addition_info: string;
  } | null;
  health_plan: {
    food_chart: string;
    exercise_plan: string;
    sleep_plan: string | null;
    generated_at: string;
  } | null;
  dietary_recommendation: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string | null;
    foods_to_avoid: string | null;
    created_at: string;
  } | null;
}
