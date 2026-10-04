import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymlab.app',
  appName: 'GymLab',
  webDir: 'dist',
  backgroundColor: '#121214',
  android: {
    backgroundColor: '#121214',
  },
  ios: {
    // Apaga el preview nativo de links en WKWebView: sin bocadillo con la URL en iOS.
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#121214',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#121214',
      style: 'DARK',
    },
  },
};

export default config;
