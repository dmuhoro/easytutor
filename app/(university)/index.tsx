import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SubjectGrid, SubjectData } from "../../components/SubjectGrid";
import { useRoadmapStore } from "../../store/roadmapStore";
import { Ionicons } from "@expo/vector-icons";
import { SUBJECTS } from "../../lib/subjects";

export default function UniversityFaculties() {
  const router = useRouter();
  const { setSubjectId, roadmaps, fetchSavedRoadmaps } = useRoadmapStore();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFaculties = async () => {
    try {
      // Local-first: university subjects are sourced from bundled content, not Supabase.
      const mapped: SubjectData[] = SUBJECTS.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        level: 'university',
        description: `${s.topics.length} Topics`,
      }));
      setSubjects(mapped);
    } catch (error) {
      console.error('[SAFE_ERROR] [SUBJECTS] fetching university subjects failed', error);
      setSubjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchSavedRoadmaps();
  }, []);

  const handleFacultyPress = (subject: SubjectData) => {
    setSubjectId(subject.id);
    router.push({
      pathname: '/(university)/[course]/roadmap',
      params: { course: subject.id, topic: subject.name } // Using subject name as topic for roadmap start
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <ScrollView 
        className="flex-1 px-5 pt-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFaculties(); }} tintColor="#a855f7" />
        }
      >
        <View className="mb-10">
          <Text className="text-[#a855f7] font-bold font-syne text-sm uppercase tracking-widest mb-2">Academic Excellence</Text>
          <Text className="text-white text-4xl font-bold font-syne mb-4">University Master</Text>
          <Text className="text-[#8a8fa3] text-lg font-dmsans leading-7">
            Prepare for your exams at degree level with scholarly depth and academic rigour.
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : (
          <View>
             <Text className="text-white text-2xl font-bold font-syne mb-6">Select Your Faculty</Text>
             <SubjectGrid subjects={subjects} onPress={handleFacultyPress} />
          </View>
        )}

        {/* Saved Courses Section */}
        {roadmaps.filter(r => r.learningMode === 'university').length > 0 && (
          <View className="mt-12 mb-20">
            <Text className="text-white text-2xl font-bold font-syne mb-6">Your Saved Courses</Text>
            {roadmaps.filter(r => r.learningMode === 'university').slice(0, 5).map((roadmap) => (
              <TouchableOpacity
                key={roadmap.id}
                onPress={() => router.push({ 
                  pathname: '/(university)/[course]/roadmap', 
                  params: { course: roadmap.subjectId || roadmap.topic, topic: roadmap.topic } 
                })}
                className="bg-[#161920] p-6 rounded-[28px] border border-[#2a2f3d] mb-4 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-4">
                   <Text className="text-white text-lg font-bold font-syne mb-1" numberOfLines={1}>{roadmap.topic}</Text>
                   <Text className="text-[#8a8fa3] text-xs font-dmsans">Degree Level Roadmap</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a855f7" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
