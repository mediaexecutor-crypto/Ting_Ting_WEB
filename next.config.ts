import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Revisiting a page you already loaded (e.g. clicking back to Orders)
  // reuses the client-side cache instantly instead of a fresh server
  // round trip, as long as it's within this window. Actions that change
  // data (create order, upload file, etc.) call router.refresh(), which
  // always bypasses this cache — so this only speeds up plain revisits,
  // it never shows stale data after an edit.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
