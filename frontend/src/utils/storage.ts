/**
 * Thin localStorage wrapper for the JWT session.
 * Keys: access token, refresh token, username. AuthContext writes these on login;
 * api/client.ts reads them to attach Bearer headers and refresh expired access tokens.
 * clear() is called on logout or when refresh fails.
 */
const ACCESS_TOKEN_KEY = 'medlife_access_token';
const REFRESH_TOKEN_KEY = 'medlife_refresh_token';
const USERNAME_KEY = 'medlife_username';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUsername: () => localStorage.getItem(USERNAME_KEY),
  setTokens: (access: string, refresh: string, username: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USERNAME_KEY, username);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },
};
