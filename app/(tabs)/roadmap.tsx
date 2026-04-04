import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../store/roadmapStore";
import * as Haptics from 'expo-haptics';

export default function RoadmapTab() {
  const router = useRouter();
  const { roadmaps, checkedTasks, toggleTask, removeRoadmap } = useRoadmapStore();
  
  // Show the most recent roadmap by default
  const activeRoadmap = roadmaps[0];
  
  const handleToggle = (day: number, task: string) => {
    if (!activeRoadmap) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(activeRoadmap.id, day, task);
  };

  const handleDelete = () => {
    if (!activeRoadmap) return;
    Alert.alert(
      "Remove Plan",
      "Are you sure you want to delete this study path?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => removeRoadmap(activeRoadmap.id) 
        }
      ]
    );
  };

  if (!activeRoadmap) {
    return (
      <SafeAreaView className="flex-1 bg-[#0d0f12] items-center justify-center px-8">
        <View className="bg-[#161920] w-20 h-20 rounded-full items-center justify-center mb-6 border border-[#2a2f3d]">
          <Ionicons name="map-outline" size={40} color="#3a3f53" />
        </View>
        <Text className="text-white text-2xl font-bold font-syne text-center mb-3">No Active Path</Text>
        <Text className="text-[#8a8fa3] text-center font-dmsans mb-10 leading-6">
          Architect your first study curriculum to see it here. Our AI will structure your journey in seconds.
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/explore')}
          className="bg-[#4f7cff] py-4 px-10 rounded-2xl shadow-lg shadow-[#4f7cff]/30"
        >
          <Text className="text-white font-bold font-syne text-lg">Explore Subjects</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      {/* Dynamic Header */}
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row justify-between items-end">
        <View className="flex-1 mr-4">
          <Text className="text-[#4f7cff] font-bold font-syne text-xs uppercase tracking-widest mb-1">Active Study Path</Text>
          <Text className="text-white text-3xl font-bold font-syne uppercase tracking-tight" numberOfLines={1}>
            {activeRoadmap.topic}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete} className="p-2">
          <Ionicons name="trash-outline" size={22} color="#f87171" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-8" showsVerticalScrollIndicator={false}>
        {activeRoadmap.days.map((dayPlan, index) => {
          const isLast = index === activeRoadmap.days.length - 1;
          const completedTasks = (checkedTasks[activeRoadmap.id]?.[dayPlan.day] || []);
          const isDayComplete = completedTasks.length === dayPlan.tasks.length && dayPlan.tasks.length > 0;
          
          let dayColor = "#4f7cff";
          let dayBg = "bg-[#4f7cff]/10";
          
          if (isDayComplete) {
            dayColor = "#22c55e";
            dayBg = "bg-[#22c55e]/10";
          }

          return (
            <View key={`day-${dayPlan.day}`} className="flex-row mb-8">
              {/* Timeline */}
              <View className="items-center mr-5 w-12">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center border border-white/5 ${dayBg}`}>
                  <Text className="font-bold font-syne text-lg" style={{ color: dayColor }}>
                    {dayPlan.day}
                  </Text>
                </View>
                {!isLast && (
                  <View className="w-[1px] flex-1 my-2 bg-[#2a2f3d]" />
                )}
              </View>

              {/* Day Content */}
              <View className="flex-1 pt-1">
                <Text className="text-white text-xl font-bold font-syne mb-4">{dayPlan.title}</Text>
                
                {dayPlan.tasks.map((task, tIndex) => {
                  const isChecked = completedTasks.includes(task);
                  
                  return (
                    <TouchableOpacity 
                      key={`${dayPlan.day}-${tIndex}`} 
                      onPress={() => handleToggle(dayPlan.day, task)}
                      activeOpacity={0.7}
                      className="bg-[#161920] rounded-2xl p-4 mb-3 border border-[#2a2f3d]/60 flex-row items-center"
                    >
                      <View className="flex-1 pr-3">
                        <Text className={`text-base font-dmsans ${isChecked ? 'text-[#3a3f53] line-through' : 'text-[#e2e8f0]'}`}>
                          {task}
                        </Text>
                      </View>
                      
                      <View className={`w-6 h-6 rounded-lg items-center justify-center border ${isChecked ? 'bg-[#4f7cff] border-[#4f7cff]' : 'border-[#2a2f3d]'}`}>
                        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
