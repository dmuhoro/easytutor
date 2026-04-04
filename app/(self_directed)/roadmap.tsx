import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RoadmapView } from "../../components/RoadmapView";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../store/roadmapStore";
import { generateStudyRoadmap } from "../../lib/api";
import * as Haptics from 'expo-haptics';

export default function SelfDirectedRoadmap() {
  const router = useRouter();
  const { topic } = useLocalSearchParams();
  const { roadmaps, addRoadmap, checkedTasks, toggleTask } = useRoadmapStore();
  
  const [loading, setLoading] = useState(false);

  // Check if we already have a roadmap for this topic
  const existingRoadmap = roadmaps.find(r => r.topic === topic);

  const performGeneration = async () => {
    if (!topic || typeof topic !== 'string') return;
    
    setLoading(true);
    try {
      const res = await generateStudyRoadmap(topic);
      if (res.success && res.data) {
        const newRoadmap = {
          id: Date.now().toString(),
          topic: topic,
          title: res.data.title,
          days: res.data.days,
          createdAt: new Date().toISOString()
        };
        addRoadmap(newRoadmap);
      } else {
        Alert.alert("AI Error", res.error || "Failed to generate roadmap.");
      }
    } catch (err) {
      console.error('Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!existingRoadmap && topic) {
      performGeneration();
    }
  }, [topic]);

  const handleToggle = (day: number, task: string) => {
    if (!existingRoadmap) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(existingRoadmap.id, day, task);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
             <Ionicons name="arrow-back" size={24} color="#22c55e" />
          </TouchableOpacity>
          <View className="flex-1">
             <Text className="text-[#22c55e] font-bold font-syne text-[10px] uppercase tracking-widest mb-1">Personalized Architecture</Text>
             <Text className="text-white text-xl font-bold font-syne" numberOfLines={1}>{topic || 'Goal'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(self_directed)/quiz', params: { topic } })}
          className="bg-[#22c55e]/10 px-4 py-2 rounded-xl border border-[#22c55e]/20"
        >
          <Text className="text-[#22c55e] font-bold font-syne text-xs">Knowledge Check</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-5 pt-8">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <View className="bg-[#161920] w-24 h-24 rounded-3xl items-center justify-center mb-6 border border-[#2a2f3d]">
               <ActivityIndicator size="large" color="#22c55e" />
            </View>
            <Text className="text-white text-2xl font-bold font-syne text-center mb-3">Socratic Architecting...</Text>
            <Text className="text-[#8a8fa3] text-center font-dmsans max-w-[280px] leading-6">
               Tailoring your explorer's path for "**{topic}**".
            </Text>
          </View>
        ) : existingRoadmap ? (
          <RoadmapView 
            roadmap={existingRoadmap} 
            checkedTasks={checkedTasks[existingRoadmap.id] || {}} 
            onToggleTask={handleToggle}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
