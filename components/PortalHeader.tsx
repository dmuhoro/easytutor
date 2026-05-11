import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useProgressStore } from '../store/progressStore';
import { GlassView } from './ui/GlassView';
import { COLORS } from '../lib/theme';

export function PortalHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { learningMode } = useRoadmapStore();
  const { studyStreak, xpTotal } = useProgressStore();

  const getPortalColor = () => {
    if (learningMode === 'high_school') return '#3b82f6';
    if (learningMode === 'university') return '#a855f7';
    return '#22c55e'; // self_directed
  };

  const getPortalName = () => {
    if (learningMode === 'high_school') return 'High School';
    if (learningMode === 'university') return 'University';
    return 'Explorer';
  };

  return (
    <View className="px-5 py-4 flex-row items-center justify-between">
      {/* Portal Indicator (Left) */}
      <TouchableOpacity 
        onPress={() => router.push('/settings')}
        activeOpacity={0.7}
      >
        <GlassView className="px-3 py-2 flex-row items-center" borderColor={getPortalColor() + '40'}>
          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getPortalColor() }} />
          <Text className="text-white font-syne font-bold text-[10px] uppercase tracking-widest">
            {getPortalName()}
          </Text>
        </GlassView>
      </TouchableOpacity>

      {/* Stats (Center) */}
      <View className="flex-row items-center bg-surface-elevated/50 px-4 py-2 rounded-full border border-surface-border">
        <View className="flex-row items-center mr-4">
          <Ionicons name="flame" size={16} color="#f59e0b" />
          <Text className="text-white font-bold ml-1.5 text-xs">{studyStreak}d</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="sparkles" size={16} color="#4f7cff" />
          <Text className="text-white font-bold ml-1.5 text-xs">{xpTotal} XP</Text>
        </View>
      </View>

      {/* Profile Toggle (Right) */}
      <TouchableOpacity 
        onPress={() => router.push('/settings')}
        activeOpacity={0.7}
        className="w-10 h-10 rounded-full bg-brand-500 items-center justify-center border-2 border-white/20 shadow-lg"
      >
        <Ionicons name="person" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}
