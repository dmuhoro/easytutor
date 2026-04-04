import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProgressStore } from "../../store/progressStore";
import { useRoadmapStore } from "../../store/roadmapStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProgressDashboard() {
  const router = useRouter();
  const { studyStreak, quizScores, topicsStudied } = useProgressStore();
  const { roadmaps, checkedTasks } = useRoadmapStore();

  const totalTopicsStudied = Object.values(topicsStudied).flat().length;
  const averageScore = quizScores.length > 0 
    ? Math.round((quizScores.reduce((acc: number, q: any) => acc + (q.score / q.total), 0) / quizScores.length) * 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4f7cff" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold font-syne">My Success</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="flex-1 px-5 pt-8">
        {/* Main Stats */}
        <View className="flex-row justify-between mb-10">
          <View className="bg-[#161920] w-[31%] p-5 rounded-[28px] border border-[#2a2f3d] items-center">
             <Ionicons name="flame" size={24} color="#f59e0b" />
             <Text className="text-white text-xl font-bold font-syne mt-2">{studyStreak}</Text>
             <Text className="text-[#8a8fa3] text-[9px] uppercase font-bold text-center mt-1">Day Streak</Text>
          </View>
          <View className="bg-[#161920] w-[31%] p-5 rounded-[28px] border border-[#2a2f3d] items-center">
             <Ionicons name="trophy" size={24} color="#4f7cff" />
             <Text className="text-white text-xl font-bold font-syne mt-2">{totalTopicsStudied}</Text>
             <Text className="text-[#8a8fa3] text-[9px] uppercase font-bold text-center mt-1">Mastered</Text>
          </View>
          <View className="bg-[#161920] w-[31%] p-5 rounded-[28px] border border-[#2a2f3d] items-center">
             <Ionicons name="analytics" size={24} color="#22c55e" />
             <Text className="text-white text-xl font-bold font-syne mt-2">{averageScore}%</Text>
             <Text className="text-[#8a8fa3] text-[9px] uppercase font-bold text-center mt-1">Avg Score</Text>
          </View>
        </View>

        {/* Active Roadmaps Progress */}
        <Text className="text-[#8a8fa3] font-bold uppercase text-xs mb-6 ml-2 tracking-widest">Active Roadmap Progress</Text>
        {roadmaps.length === 0 ? (
          <View className="bg-[#161920] rounded-[32px] p-8 border-2 border-dashed border-[#2a2f3d] items-center mb-10">
            <Ionicons name="map-outline" size={32} color="#3a3f53" />
            <Text className="text-[#8a8fa3] text-center font-dmsans mt-4">No active roadmaps being tracked.</Text>
          </View>
        ) : (
          roadmaps.slice(0, 3).map((roadmap) => {
            const totalTasks = roadmap.days.reduce((acc, day) => acc + day.tasks.length, 0);
            const roadmapChecked = checkedTasks[roadmap.id] || {};
            const completedTasks = Object.values(roadmapChecked).reduce((acc, dayTasks) => acc + dayTasks.length, 0);
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <View key={roadmap.id} className="bg-[#161920] rounded-[32px] p-6 mb-5 border border-[#2a2f3d]">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-lg font-bold font-syne flex-1 mr-4" numberOfLines={1}>{roadmap.topic}</Text>
                  <Text className="text-[#4f7cff] font-bold font-syne text-xs">{Math.round(progress)}%</Text>
                </View>
                <View className="w-full bg-[#0d0f12] h-2 rounded-full overflow-hidden border border-[#2a2f3d]">
                  <View 
                    className="bg-[#4f7cff] h-full rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
                </View>
                <Text className="text-[#8a8fa3] text-[10px] font-dmsans uppercase tracking-widest mt-4">
                   {completedTasks} / {totalTasks} MISSION TASKS COMPLETED
                </Text>
              </View>
            );
          })
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
