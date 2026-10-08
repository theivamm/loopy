import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loopy.app',
  appName: 'Loopy',
  // webDir is still required by the CLI even though we never ship these files —
  // server.url below makes the app load the live site instead of a bundled copy.
  webDir: 'dist',
  server: {
    url: 'https://loopy-pi.vercel.app',
    androidScheme: 'https',
  },
};

export default config;
