import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useOnboardingStore } from '../store/onboardingStore';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  const { session, setSession, isLoading: authLoading } = useAuthStore();
  const { 
    onboardingComplete, 
    learningMode, 
    setUserId: setRoadmapUserId,
    setLearningMode,
    setOnboardingComplete 
  } = useRoadmapStore();
  const { setUserId: setProgressUserId } = useProgressStore();
  const segments = useSegments();
  const router = useRouter();

  const syncProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('learning_mode, onboarding_complete')
      .eq('id', userId)
      .single();
    
    if (data) {
      if (data.learning_mode) setLearningMode(data.learning_mode as any);
      if (data.onboarding_complete !== undefined) setOnboardingComplete(data.onboarding_complete);
    }
  };

  useEffect(() => {
    // 1. Handle Initial Session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session || null);
        setProgressUserId(session?.user?.id ?? null);
        setRoadmapUserId(session?.user?.id ?? null);
        if (session?.user?.id) syncProfile(session.user.id);
      })
      .catch(() => {
        setSession(null);
      });

    // 2. Listen for Auth Changes (Sign In/Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session || null);
      setProgressUserId(session?.user?.id ?? null);
      setRoadmapUserId(session?.user?.id ?? null);
      if (session?.user?.id) syncProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inHS = segments[0] === '(high_school)';
    const inUniv = segments[0] === '(university)';
    const inSelf = segments[0] === '(self_directed)';

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (!onboardingComplete) {
      if (!inOnboarding) router.replace('/onboarding');
    } else {
      // Logic for Portal Redirection (Section 4)
      if (inAuthGroup || inOnboarding) {
        if (learningMode === 'high_school') router.replace('/(high_school)');
        else if (learningMode === 'university') router.replace('/(university)');
        else if (learningMode === 'self_directed') router.replace('/(self_directed)');
        else router.replace('/(tabs)'); // Fallback
      }
    }
  }, [session, onboardingComplete, learningMode, authLoading, fontsLoaded, segments]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(high_school)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(university)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(self_directed)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="explore" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

