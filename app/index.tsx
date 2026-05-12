import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommandCenter } from '../components/CommandCenter';

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

  // 3. If session AND onboarding_complete = TRUE → Show CommandCenter
  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <CommandCenter />
    </SafeAreaView>
  );
}
