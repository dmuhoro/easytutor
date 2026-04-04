import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RoadmapView } from "../../../components/RoadmapView";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../../store/roadmapStore";
import { generateStudyRoadmap } from "../../../lib/api";
import * as Haptics from 'expo-haptics';

export default function UniversityRoadmap() {
  const router = useRouter();
  const { course, topic } = useLocalSearchParams();
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
             <Ionicons name="arrow-back" size={24} color="#a855f7" />
          </TouchableOpacity>
          <View className="flex-1">
             <Text className="text-[#a855f7] font-bold font-syne text-[10px] uppercase tracking-widest mb-1">Undergraduate Study Plan</Text>
             <Text className="text-white text-xl font-bold font-syne" numberOfLines={1}>{topic || 'Roadmap'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(university)/[course]/quiz', params: { course, topic } })}
          className="bg-[#a855f7]/10 px-4 py-2 rounded-xl border border-[#a855f7]/20"
        >
          <Text className="text-[#a855f7] font-bold font-syne text-xs">Exams (Quiz)</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-5 pt-8">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <View className="bg-[#161920] w-24 h-24 rounded-3xl items-center justify-center mb-6 border border-[#2a2f3d]">
               <ActivityIndicator size="large" color="#a855f7" />
            </View>
            <Text className="text-white text-2xl font-bold font-syne text-center mb-3">Analyzing Academic Outline...</Text>
            <Text className="text-[#8a8fa3] text-center font-dmsans max-w-[280px] leading-6">
               Generating degree-level rigor for "**{topic}**".
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
