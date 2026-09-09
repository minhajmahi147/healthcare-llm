/**
 * TypeScript shapes for auth. LoginCredentials is the login form body.
 * RegisterPayload adds `name`. AuthTokens is the JWT pair from Django
 * plus is_staff so the SPA can route admins separately.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
}

export interface AdminRegisterPayload {
  username: string;
  password: string;
  email?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  is_staff: boolean;
  username: string;
}

export interface AuthUser {
  username: string;
  isStaff: boolean;
}
