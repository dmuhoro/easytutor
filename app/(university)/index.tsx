import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { SubjectGrid, SubjectData } from "../../components/SubjectGrid";
import { useRoadmapStore } from "../../store/roadmapStore";
import { Ionicons } from "@expo/vector-icons";

export default function UniversityFaculties() {
  const router = useRouter();
  const { setSubjectId } = useRoadmapStore();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('level', 'university')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching Univ faculties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
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
          <SubjectGrid subjects={subjects} onPress={handleFacultyPress} />
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
