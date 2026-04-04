import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { SubjectGrid, SubjectData } from "../../components/SubjectGrid";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../store/roadmapStore";

export default function HighSchoolSyllabus() {
  const router = useRouter();
  const { setSubjectId } = useRoadmapStore();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('level', 'high_school')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching HS subjects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubjectPress = (subject: SubjectData) => {
    setSubjectId(subject.id);
    router.push({
      pathname: '/(high_school)/[subject]/topics',
      params: { subject: subject.id, name: subject.name }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <ScrollView 
        className="flex-1 px-5 pt-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubjects(); }} tintColor="#4f7cff" />
        }
      >
        <View className="mb-10">
          <Text className="text-[#4f7cff] font-bold font-syne text-sm uppercase tracking-widest mb-2">My Learning Portal</Text>
          <Text className="text-white text-4xl font-bold font-syne mb-4">KCSE Syllabus</Text>
          <Text className="text-[#8a8fa3] text-lg font-dmsans leading-7">
            Explore the KICD curriculum. Choose a subject to begin your personalized study path.
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4f7cff" />
          </View>
        ) : (
          <SubjectGrid subjects={subjects} onPress={handleSubjectPress} />
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
