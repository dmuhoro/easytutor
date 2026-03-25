import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded and the UI is ready
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // We continue even if fonts are not loaded to allow visibility during early testing/web view
  return (
    <>
      <StatusBar style="light" />
      {fontsLoaded ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#0d0f12', alignItems: 'center', justifyCenter: 'center' }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </View>
      )}
    </>
  );
}
