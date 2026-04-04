import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { View, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  const { session, isLoading: authLoading } = useAuthStore();
  const { onboardingComplete, learningMode } = useRoadmapStore();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0f12', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4f7cff" />
      </View>
    );
  }

  // 1. If no session → redirect to (auth)/login (Section 4)
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // 2. If session AND onboarding_complete = FALSE → redirect to /onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // 3. If session AND onboarding_complete = TRUE → redirect based on learning_mode
  if (learningMode === 'high_school') {
    return <Redirect href="/(high_school)" />;
  }
  
  if (learningMode === 'university') {
    return <Redirect href="/(university)" />;
  }
  
  if (learningMode === 'self_directed') {
    return <Redirect href="/(self_directed)" />;
  }

  // Fallback to tabs or explore
  return <Redirect href="/explore" />;
}
