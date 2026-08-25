/// <reference types="vite/client" />

/**
 * Ambient TypeScript types for Vite.
 * Declares `import.meta.env.VITE_API_BASE_URL`, which api/client.ts uses as the
 * backend prefix (defaults to `/api` and is proxied to Django in vite.config.ts).
 */

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
