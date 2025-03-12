
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f231bd02b9d646188f85148b66ac96dd',
  appName: 'dermo-helper-app',
  webDir: 'dist',
  server: {
    url: 'https://f231bd02-b9d6-4618-8f85-148b66ac96dd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera'],
    },
  }
};

export default config;
