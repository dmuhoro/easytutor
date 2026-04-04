import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettingsStore } from "../../store/settingsStore";
import { useProgressStore } from "../../store/progressStore";
import { useRoadmapStore, LearningMode } from "../../store/roadmapStore";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, useLocalLLM, ollamaModel, setTheme, setUseLocalLLM, setOllamaModel } = useSettingsStore();
  const { clearProgress } = useProgressStore();
  const { clearRoadmaps, learningMode, setLearningMode } = useRoadmapStore();
  const { signOut, user } = useAuthStore();
  
  const [updatingMode, setUpdatingMode] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      "Reset All Progress",
      "This will permanently delete all your roadmaps and study history. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive", 
          onPress: () => {
            clearProgress();
            clearRoadmaps();
            Alert.alert("Success", "All local data has been cleared.");
          }
        }
      ]
    );
  };

  const handleSwitchMode = async (newMode: LearningMode) => {
    if (newMode === learningMode) return;
    
    setUpdatingMode(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ learning_mode: newMode })
        .eq('id', user?.id);

      if (error) throw error;

      setLearningMode(newMode);
      
      // Redirect to new portal
      if (newMode === 'high_school') router.replace('/(high_school)');
      else if (newMode === 'university') router.replace('/(university)');
      else if (newMode === 'self_directed') router.replace('/(self_directed)');
      
    } catch (err: any) {
      Alert.alert("Error", "Could not switch learning mode. Please check your connection.");
    } finally {
      setUpdatingMode(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold font-syne">Settings</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="flex-1 px-5 pt-8">
        <Text className="text-[#8a8fa3] font-bold uppercase text-xs mb-4 ml-2 tracking-widest">Active Portal</Text>
        <View className="bg-[#161920] rounded-[32px] p-2 mb-10 border border-[#2a2f3d]">
          {(['high_school', 'university', 'self_directed'] as LearningMode[]).map((mode) => {
            const isSelected = learningMode === mode;
            const label = mode === 'high_school' ? 'High School' : mode === 'university' ? 'University' : 'Self-Directed';
            const icon = mode === 'high_school' ? 'school' : mode === 'university' ? 'business' : 'compass';
            const color = mode === 'high_school' ? '#4f7cff' : mode === 'university' ? '#a855f7' : '#22c55e';
            
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => handleSwitchMode(mode)}
                className={`flex-row items-center justify-between p-4 rounded-[24px] ${isSelected ? 'bg-[#0d0f12]' : ''}`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: isSelected ? color : '#2a2f3d' }}>
                     <Ionicons name={icon} size={20} color={isSelected ? 'white' : '#8a8fa3'} />
                  </View>
                  <Text className={`font-syne text-base ${isSelected ? 'text-white font-bold' : 'text-[#8a8fa3]'}`}>{label}</Text>
                </View>
                {isSelected && (
                   updatingMode ? <ActivityIndicator size="small" color={color} /> : <Ionicons name="checkmark-circle" size={20} color={color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-[#8a8fa3] font-bold uppercase text-xs mb-4 ml-2 tracking-widest">Preferences</Text>
        <View className="bg-[#161920] rounded-[32px] p-6 mb-10 border border-[#2a2f3d]">
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
              <Ionicons name="moon-outline" size={22} color="#8a8fa3" />
              <Text className="text-white font-dmsans text-lg ml-3">Dark Mode</Text>
            </View>
            <Switch 
              value={theme === 'dark' || theme === 'system'} 
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: '#2a2f3d', true: '#4f7cff' }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="cloud-offline-outline" size={22} color="#8a8fa3" />
                <Text className="text-white font-dmsans text-lg ml-3">Local Logic</Text>
              </View>
              <Text className="text-[#5a5f73] text-[10px] ml-9 uppercase font-bold tracking-widest">Force Ollama fallback</Text>
            </View>
            <Switch 
              value={useLocalLLM} 
              onValueChange={setUseLocalLLM}
              trackColor={{ false: '#2a2f3d', true: '#4f7cff' }}
            />
          </View>
        </View>

        <Text className="text-[#ef4444] font-bold uppercase text-xs mb-4 ml-2 tracking-widest">Danger Zone</Text>
        <View className="bg-red-500/5 rounded-[32px] p-2 mb-20 border border-red-500/20">
          <TouchableOpacity onPress={handleClearData} className="flex-row items-center p-5">
             <Ionicons name="refresh-circle" size={24} color="#ef4444" />
             <Text className="text-[#ef4444] font-syne text-base ml-3">Reset All Local Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} className="flex-row items-center p-5 border-t border-red-500/10">
             <Ionicons name="log-out" size={24} color="#ef4444" />
             <Text className="text-[#ef4444] font-syne text-base ml-3">Sign Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
