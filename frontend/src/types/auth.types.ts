/**
 * TypeScript shapes for auth. LoginCredentials is the login form body.
 * RegisterPayload adds `name`. AuthTokens is the JWT pair from Django.
 * AuthUser is what AuthContext stores in React state (currently just username).
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthUser {
  username: string;
}
