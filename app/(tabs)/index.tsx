import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SUBJECTS } from "../../lib/subjects";
import { Ionicons } from "@expo/vector-icons";
import { useProgressStore } from "../../store/progressStore";
import { useNetInfo } from "@react-native-community/netinfo";
import { preloadQuizCache } from "../../lib/cache";

export default function HomeTab() {
  const router = useRouter();
  const { updateStreak, studyStreak, topicsStudied } = useProgressStore();
  const { isConnected } = useNetInfo();

  useEffect(() => {
    updateStreak();
    if (isConnected) {
      preloadQuizCache();
    }
  }, [isConnected]);

  const totalTopicsStudied = Object.values(topicsStudied).flat().length;

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="mb-6 mt-2 flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-white text-5xl font-bold font-syne mb-2 tracking-tight">EasyTutor</Text>
            <Text className="text-[#8a8fa3] text-base font-dmsans">
              Study anything. On your terms.
            </Text>
          </View>
          
          <View className="items-end space-y-3">
             <TouchableOpacity 
               onPress={() => router.push('/settings')} 
               className="bg-[#161920] p-2.5 rounded-full border border-[#2a2f3d] mb-3 shadow-sm"
             >
               <Ionicons name="settings" size={22} color="#8a8fa3" />
             </TouchableOpacity>
             <View className="bg-[#f59e0b]/20 px-3 py-2 rounded-2xl border border-[#f59e0b]/30 items-center flex-row shadow-lg">
               <Ionicons name="flame" size={20} color="#f59e0b" />
               <Text className="text-[#f59e0b] font-bold text-lg ml-1 font-syne">{studyStreak}</Text>
             </View>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row items-center bg-[#161920] rounded-2xl p-4 mb-8 border border-[#2a2f3d]">
          <View className="w-12 h-12 bg-[#4f7cff]/20 rounded-full items-center justify-center mr-4">
             <Ionicons name="library" size={24} color="#4f7cff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold font-syne text-xl">{totalTopicsStudied} Topics Mapped</Text>
            <Text className="text-[#8a8fa3] text-sm font-dmsans mt-1">Keep up the momentum!</Text>
          </View>
        </View>

        {/* Quick Quiz Button */}
        <TouchableOpacity 
          className="bg-[#4f7cff] flex-row items-center justify-center p-4 rounded-xl mb-10 shadow-lg shadow-[#4f7cff]/30"
          onPress={() => router.push('/quiz')}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={20} color="#ffffff" />
          <Text className="text-white font-bold font-syne text-lg ml-2">Quick Quiz</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold font-syne mb-6">Subjects</Text>

        {/* Subjects Grid */}
        <View className="flex-row flex-wrap justify-between">
          {SUBJECTS.map((subject) => {
            const topicCount = subject.topics.length;
            const completedInSubject = (topicsStudied[subject.id] || []).length;
            const progress = topicCount > 0 ? (completedInSubject / topicCount) * 100 : 0;

            return (
              <TouchableOpacity
                key={subject.id}
                className="w-[48%] bg-[#161920] rounded-3xl p-5 mb-4 border border-[#2a2f3d]/60"
                onPress={() => router.push({ pathname: '/study', params: { subjectId: subject.id } })}
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 bg-[#0d0f12] rounded-full items-center justify-center mb-5 border border-[#2a2f3d]">
                  <Text className="text-2xl">{subject.icon}</Text>
                </View>
                <Text className="text-white text-lg font-bold font-syne mb-2" numberOfLines={2}>
                  {subject.name}
                </Text>
                <Text className="text-[#8a8fa3] text-sm font-dmsans mt-auto mb-3">
                  {completedInSubject} / {topicCount} topics
                </Text>

                <View className="w-full bg-[#0d0f12] h-1.5 rounded-full overflow-hidden">
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
