import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../store/roadmapStore";

const ROADMAP_DATA = [
  {
    day: 1,
    title: "Today",
    tasks: ["Build Core UI", "Study: Engineering Math"],
  },
  {
    day: 2,
    title: "",
    tasks: ["Build Quiz Engine", "Study: Vectors, Matrices"],
  },
  {
    day: 3,
    title: "",
    tasks: ["Build Auth", "Study: Vehicle Fuel System"],
  },
  {
    day: 4,
    title: "",
    tasks: ["Build Progress Dashboard", "Study: Auto Eng Science"],
  },
  {
    day: 5,
    title: "",
    tasks: ["Deploy to TestFlight/Expo Go", "Study: Electrical & Drawing"],
  },
  {
    day: 6,
    title: "Pre-exam",
    tasks: ["Study only — use EasyTutor quiz mode"],
    warning: true,
  },
  {
    day: 7,
    title: "Exam",
    tasks: ["Final review — quick quiz every subject"],
    warning: true,
  },
];

export default function RoadmapTab() {
  const { checkedTasks, toggleTask } = useRoadmapStore();

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-4 py-6 border-b border-[#2a2f3d]">
        <Text className="text-white text-3xl font-bold font-syne mb-2">My Roadmap</Text>
        <Text className="text-[#8a8fa3] text-base font-dmsans">
          7-Day Cram Plan for CDACC End-Term Exams.
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-8" showsVerticalScrollIndicator={false}>
        {ROADMAP_DATA.map((plan, index) => {
          const isLast = index === ROADMAP_DATA.length - 1;
          const isWarning = plan.warning;
          
          let dayColor = isWarning ? "#f59e0b" : "#4f7cff";
          let dayBg = isWarning ? "bg-[#f59e0b]/10" : "bg-[#4f7cff]/10";
          let borderColor = isWarning ? "border-[#f59e0b]/30" : "border-[#2a2f3d]";
          
          const completedForDay = checkedTasks[plan.day] || [];
          const allCompleted = completedForDay.length === plan.tasks.length;

          if (allCompleted && !isWarning) {
            dayColor = "#22c55e"; // Green if fully done
            dayBg = "bg-[#22c55e]/10";
          }

          return (
            <View key={plan.day} className="flex-row mb-6">
              {/* Timeline Connector */}
              <View className="items-center mr-4 w-10">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${dayBg}`}>
                  <Text className="font-bold font-syne" style={{ color: dayColor }}>
                    D{plan.day}
                  </Text>
                </View>
                {!isLast && (
                  <View className={`w-0.5 flex-1 mt-2 mb-2 bg-[#2a2f3d]`} />
                )}
              </View>

              {/* Card */}
              <View className={`flex-1 bg-[#161920] rounded-2xl p-5 border ${borderColor}`}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold font-syne">
                    Day {plan.day} {plan.title ? `(${plan.title})` : ''}
                  </Text>
                  {isWarning && <Ionicons name="warning" size={20} color="#f59e0b" />}
                </View>
                
                <View>
                  {plan.tasks.map((task, tIndex) => {
                    const isChecked = completedForDay.includes(task);
                    
                    return (
                      <TouchableOpacity 
                        key={tIndex} 
                        className="flex-row items-start mb-3"
                        onPress={() => toggleTask(plan.day, task)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="return-down-forward" 
                          size={18} 
                          color="#8a8fa3" 
                          className="mr-2 mt-0.5" 
                        />
                        <Text className={`flex-1 text-base font-dmsans ${isChecked ? 'text-[#8a8fa3] line-through' : 'text-[#e2e8f0]'}`}>
                          {task}
                        </Text>
                        
                        <View className={`w-6 h-6 rounded-md border ml-3 items-center justify-center ${isChecked ? 'bg-[#4f7cff] border-[#4f7cff]' : 'border-[#8a8fa3]'}`}>
                          {isChecked && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
