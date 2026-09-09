/**
 * Thin localStorage wrapper for the JWT session.
 * Keys: access token, refresh token, username, is_staff.
 */
const ACCESS_TOKEN_KEY = 'medlife_access_token';
const REFRESH_TOKEN_KEY = 'medlife_refresh_token';
const USERNAME_KEY = 'medlife_username';
const IS_STAFF_KEY = 'medlife_is_staff';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUsername: () => localStorage.getItem(USERNAME_KEY),
  getIsStaff: () => localStorage.getItem(IS_STAFF_KEY) === 'true',
  setTokens: (access: string, refresh: string, username: string, isStaff = false) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(IS_STAFF_KEY, isStaff ? 'true' : 'false');
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(IS_STAFF_KEY);
  },
};
