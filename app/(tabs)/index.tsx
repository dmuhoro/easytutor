import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SUBJECTS } from "../../lib/subjects";
import { Ionicons } from "@expo/vector-icons";
import { useProgressStore } from "../../store/progressStore";
import { useRoadmapStore } from "../../store/roadmapStore";
import { useAuthStore } from "../../store/authStore";
import { useNetInfo } from "@react-native-community/netinfo";
import { preloadQuizCache } from "../../lib/cache";

export default function HomeTab() {
  const router = useRouter();
  const { updateStreak, studyStreak, topicsStudied } = useProgressStore();
  const { roadmaps } = useRoadmapStore();
  const { user } = useAuthStore();
  const { isConnected } = useNetInfo();

  useEffect(() => {
    updateStreak();
    if (isConnected) {
      preloadQuizCache();
    }
  }, [isConnected]);

  const totalTopicsStudied = Object.values(topicsStudied).flat().length;
  const displayName = user?.email?.split('@')[0] ?? 'Student';

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="mb-8 mt-2 flex-row justify-between items-center">
          <View className="flex-1 mr-4">
            <Text className="text-[#8a8fa3] text-lg font-dmsans">Welcome back,</Text>
            <Text className="text-white text-4xl font-bold font-syne tracking-tight capitalize">
              {displayName}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/settings')} 
            className="bg-[#161920] p-3 rounded-2xl border border-[#2a2f3d] shadow-sm"
          >
            <Ionicons name="person" size={22} color="#4f7cff" />
          </TouchableOpacity>
        </View>

        {/* Global Search Trigger */}
        <TouchableOpacity 
          onPress={() => router.push('/explore')}
          className="bg-[#161920] rounded-2xl border border-[#2a2f3d]/60 p-4 mb-10 flex-row items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#4f7cff" />
          <Text className="text-[#5a5f73] font-dmsans text-base ml-3 flex-1">Explore all subjects...</Text>
          <View className="bg-[#4f7cff]/10 px-2 py-1 rounded-lg">
             <Text className="text-[#4f7cff] font-bold font-syne text-[10px] uppercase">Browse Library</Text>
          </View>
        </TouchableOpacity>

        {/* Dashboard Stats Card */}
        <View className="bg-[#161920] rounded-[32px] p-6 mb-10 border border-[#2a2f3d] shadow-2xl overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-[#4f7cff]/5 rounded-full" />
          
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-[#8a8fa3] text-sm font-dmsans uppercase tracking-widest mb-1">Current Streak</Text>
              <View className="flex-row items-center">
                <Ionicons name="flame" size={32} color="#f59e0b" />
                <Text className="text-white text-4xl font-bold font-syne ml-2">{studyStreak} Days</Text>
              </View>
            </View>
            
            <View className="bg-[#4f7cff]/10 px-4 py-2 rounded-xl border border-[#4f7cff]/20">
               <Text className="text-[#4f7cff] font-bold font-syne">{totalTopicsStudied} Topics Mastered</Text>
            </View>
          </View>
        </View>

        {/* Roadmaps Section */}
        <View className="mb-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold font-syne">My Roadmaps</Text>
            <TouchableOpacity onPress={() => router.push('/roadmaps/create')}>
              <Text className="text-[#4f7cff] font-dmsans font-bold">+ New Roadmap</Text>
            </TouchableOpacity>
          </View>

          {roadmaps.length === 0 ? (
            <TouchableOpacity 
              className="bg-[#161920] rounded-[28px] p-8 border-2 border-dashed border-[#2a2f3d] items-center"
              onPress={() => router.push('/roadmaps/create')}
            >
              <View className="w-12 h-12 bg-[#4f7cff]/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="sparkles" size={24} color="#4f7cff" />
              </View>
              <Text className="text-white font-bold font-syne text-lg">Create your first AI Roadmap</Text>
              <Text className="text-[#8a8fa3] text-sm font-dmsans mt-2 text-center">
                Master any topic with a custom 7-day curriculum.
              </Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
              {roadmaps.slice(0, 3).map((roadmap) => (
                <TouchableOpacity 
                   key={roadmap.id}
                   onPress={() => router.push(`/roadmaps/${roadmap.id}`)}
                   className="bg-[#161920] w-64 mr-4 p-6 rounded-[28px] border border-[#2a2f3d]"
                >
                  <View className="flex-row items-center mb-4">
                    <View className="bg-[#4f7cff] w-10 h-10 rounded-xl items-center justify-center mr-3">
                       <Ionicons name="map" size={20} color="white" />
                    </View>
                    <Text className="text-white font-bold font-syne flex-1" numberOfLines={1}>{roadmap.topic}</Text>
                  </View>
                  <Text className="text-[#8a8fa3] text-xs font-dmsans mb-4">7 Day Curriculum</Text>
                  <View className="flex-row items-center">
                    <Text className="text-[#4f7cff] font-bold text-sm">View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#4f7cff" className="ml-1" />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => router.push('/roadmaps/create')}
                className="bg-[#4f7cff]/10 w-24 rounded-[28px] border border-dashed border-[#4f7cff]/40 items-center justify-center mr-5"
              >
                <Ionicons name="add" size={32} color="#4f7cff" />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Recommended "Next Up" Section */}
        <View className="mb-10">
          <Text className="text-white text-2xl font-bold font-syne mb-5">Recommended Next Up</Text>
          <TouchableOpacity 
            className="bg-[#4f7cff] rounded-[28px] p-6 shadow-xl shadow-[#4f7cff]/30 flex-row items-center justify-between"
            onPress={() => router.push('/quiz')}
            activeOpacity={0.9}
          >
            <View className="flex-1 pr-4">
              <Text className="text-white/70 font-dmsans text-sm uppercase tracking-wider mb-1">Knowledge Check</Text>
              <Text className="text-white text-xl font-bold font-syne mb-2">Automotive Engineering 101</Text>
              <View className="flex-row items-center">
                 <Ionicons name="timer-outline" size={16} color="white" />
                 <Text className="text-white/80 font-dmsans text-xs ml-1">5 min Quick Quiz</Text>
              </View>
            </View>
            <View className="bg-white/20 p-4 rounded-2xl">
              <Ionicons name="play" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Subjects Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-2xl font-bold font-syne">My Learning Path</Text>
          <TouchableOpacity><Text className="text-[#4f7cff] font-dmsans font-bold">View All</Text></TouchableOpacity>
        </View>

        {/* Subjects Grid */}
        <View className="flex-row flex-wrap justify-between">
          {SUBJECTS.map((subject) => {
            const topicCount = subject.topics.length;
            const completedInSubject = (topicsStudied[subject.id] || []).length;
            const progress = topicCount > 0 ? (completedInSubject / topicCount) * 100 : 0;

            return (
              <TouchableOpacity
                key={subject.id}
                className="w-[48%] bg-[#161920] rounded-[28px] p-5 mb-5 border border-[#2a2f3d]/60 shadow-sm"
                onPress={() => router.push({ pathname: '/study', params: { subjectId: subject.id } })}
                activeOpacity={0.7}
              >
                <View className="w-11 h-11 bg-[#0d0f12] rounded-2xl items-center justify-center mb-4 border border-[#2a2f3d]">
                  <Text className="text-xl">{subject.icon}</Text>
                </View>
                <Text className="text-white text-lg font-bold font-syne mb-1" numberOfLines={2}>
                  {subject.name}
                </Text>
                <Text className="text-[#8a8fa3] text-xs font-dmsans mb-4">
                  {completedInSubject}/{topicCount} Topics
                </Text>

                <View className="w-full bg-[#2a2f3d] h-2 rounded-full overflow-hidden">
                  <View 
                    className="bg-[#4f7cff] h-full rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}


