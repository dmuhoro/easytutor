import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore, LearningMode } from "../store/roadmapStore";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import * as Haptics from 'expo-haptics';

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setLearningMode, setOnboardingComplete } = useRoadmapStore();
  
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const [loading, setLoading] = useState(false);

  const MODES: { id: LearningMode; title: string; subtitle: string; icon: any; color: string }[] = [
    {
      id: 'high_school',
      title: 'High School Student',
      subtitle: 'KCSE & CBC curriculum, Kenya syllabus',
      icon: 'school-outline',
      color: '#4f7cff'
    },
    {
      id: 'university',
      title: 'University / College',
      subtitle: 'Degree-level subjects, local universities',
      icon: 'library-outline',
      color: '#a855f7'
    },
    {
      id: 'self_directed',
      title: 'Self-Directed Learner',
      subtitle: 'Learn anything, your way, no curriculum',
      icon: 'compass-outline',
      color: '#22c55e'
    },
  ];

  const handleSelect = (mode: LearningMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMode(mode);
  };

  const handleGetStarted = async () => {
    if (!selectedMode || !user) return;
    
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Update Supabase profiles table (Section 5)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          learning_mode: selectedMode,
          onboarding_complete: true 
        })
        .eq('id', user.id);

      if (error) {
        // If profile doesn't exist yet, we might need to insert it
        // Depending on how auth triggers work. For now, we'll alert.
        console.error('Supabase Error:', error);
      }

      // 2. Update Zustand store
      setLearningMode(selectedMode);
      setOnboardingComplete(true);

      // 3. Dynamic Navigation (Section 4)
      if (selectedMode === 'high_school') router.replace('/(high_school)');
      else if (selectedMode === 'university') router.replace('/(university)');
      else if (selectedMode === 'self_directed') router.replace('/(self_directed)');
      
    } catch (err: any) {
      Alert.alert("Connection Error", "We couldn't save your preference. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12] px-6 py-10">
      <View className="mb-12">
        <Text className="text-[#4f7cff] font-bold font-syne text-sm uppercase tracking-widest mb-2">Welcome to EasyTutor</Text>
        <Text className="text-white text-4xl font-bold font-syne mb-4">Choose your learning path</Text>
        <Text className="text-[#8a8fa3] text-lg font-dmsans">
          Select how you want to learn today. You can always change this later in settings.
        </Text>
      </View>

      <View className="flex-1">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              onPress={() => handleSelect(mode.id)}
              activeOpacity={0.8}
              className={`mb-6 p-6 rounded-[32px] border-2 flex-row items-center ${isSelected ? 'bg-[#161920] border-[#4f7cff] shadow-xl shadow-[#4f7cff]/20' : 'bg-[#161920]/50 border-[#2a2f3d]'}`}
            >
              <View 
                className={`w-14 h-14 rounded-2xl items-center justify-center mr-5 ${isSelected ? 'bg-[#4f7cff]' : 'bg-[#2a2f3d]'}`}
              >
                <Ionicons name={mode.icon} size={28} color={isSelected ? 'white' : '#8a8fa3'} />
              </View>
              <View className="flex-1">
                <Text className={`text-xl font-bold font-syne mb-1 ${isSelected ? 'text-white' : 'text-[#8a8fa3]'}`}>{mode.title}</Text>
                <Text className="text-[#5a5f73] text-sm font-dmsans">{mode.subtitle}</Text>
              </View>
              {isSelected && (
                <View className="bg-[#4f7cff] rounded-full p-1">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handleGetStarted}
        disabled={!selectedMode || loading}
        className={`py-5 rounded-2xl flex-row items-center justify-center ${selectedMode && !loading ? 'bg-[#4f7cff] shadow-lg shadow-[#4f7cff]/40' : 'bg-[#161920] opacity-50'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold font-syne text-lg uppercase tracking-widest">Get Started</Text>
        )}
      </TouchableOpacity>

      {/* Decorative Glow */}
      <View className="absolute -top-40 -right-40 w-80 h-80 bg-[#4f7cff]/5 rounded-full blur-[100px]" />
    </SafeAreaView>
  );
}
