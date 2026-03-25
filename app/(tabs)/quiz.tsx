import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { generateQuizQuestion } from "../../lib/api";
import { SUBJECTS } from "../../lib/subjects";
import { useProgressStore } from "../../store/progressStore";
import { useNetInfo } from "@react-native-community/netinfo";
import { getCachedQuizQuestions } from "../../lib/cache";
import * as Haptics from 'expo-haptics';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const TOTAL_QUESTIONS = 10;

export default function QuizTab() {
  const { markTopicDone, addQuizScore } = useProgressStore();
  const { isConnected } = useNetInfo();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const getRandomTopic = () => {
    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const randomTopic = randomSubject.topics[Math.floor(Math.random() * randomSubject.topics.length)];
    return { subjectId: randomSubject.id, subjectName: randomSubject.name, topicName: randomTopic };
  };

  const [currentQuizSubjectId, setCurrentQuizSubjectId] = useState<string>('');
  const [currentQuizTopic, setCurrentQuizTopic] = useState<string>('');

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError('');
    setSelectedOption(null);
    setShowExplanation(false);
    
    // Pick a random subject and topic to test the user's overall knowledge!
    const { subjectId, subjectName, topicName } = getRandomTopic();
    setCurrentQuizSubjectId(subjectId);
    setCurrentQuizTopic(topicName);

    if (isConnected === false) {
      const cached = await getCachedQuizQuestions(subjectId);
      if (cached && cached.length > 0) {
        const q = cached[Math.floor(Math.random() * cached.length)];
        setQuestionData(q);
      } else {
        setError('You are offline and no questions are cached for this subject.');
      }
      setLoading(false);
      return;
    }

    const res = await generateQuizQuestion(subjectName, topicName);

    if (res.success) {
      setQuestionData(res.data);
    } else {
      setError(res.error ?? 'Failed to generate quiz question.');
    }

    setLoading(false);
  };

  const handleSelectOption = (index: number) => {
    if (showExplanation || !questionData) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === questionData.correct) {
      setScore(prev => prev + 1);
      markTopicDone(currentQuizSubjectId, currentQuizTopic);
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 >= TOTAL_QUESTIONS) {
      // Complete quiz, save score
      const finalScore = score + (selectedOption === questionData?.correct ? 1 : 0);
      addQuizScore(finalScore, TOTAL_QUESTIONS);
      setIsFinished(true);
    } else {
      setQuestionIndex(prev => prev + 1);
      fetchNextQuestion();
    }
  };

  const handleTryAgain = () => {
    setQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    fetchNextQuestion();
  };

  if (isFinished) {
    return (
      <SafeAreaView className="flex-1 bg-[#0d0f12] items-center justify-center px-6" edges={['top']}>
        <Ionicons name="trophy" size={80} color="#f59e0b" className="mb-6" />
        <Text className="text-white text-4xl font-bold font-syne mb-2">Quiz Complete!</Text>
        <Text className="text-[#8a8fa3] text-lg font-dmsans mb-8 text-center">
          You scored {score} out of {TOTAL_QUESTIONS}.
        </Text>
        
        <TouchableOpacity 
          className="bg-[#4f7cff] py-4 px-10 rounded-2xl flex-row items-center shadow-lg shadow-[#4f7cff]/30"
          onPress={handleTryAgain}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text className="text-white font-bold font-syne text-lg ml-2">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progressPercentage = (questionIndex / TOTAL_QUESTIONS) * 100;

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      {/* Header with Progress Bar */}
      <View className="px-4 py-4 border-b border-[#2a2f3d]">
        <View className="flex-row justify-between items-end mb-3">
          <Text className="text-white text-3xl font-bold font-syne">Quick Quiz</Text>
          <Text className="text-[#8a8fa3] font-dmsans font-bold mb-1">
            {questionIndex + 1} / {TOTAL_QUESTIONS}
          </Text>
        </View>
        <View className="w-full bg-[#161920] h-2 rounded-full overflow-hidden border border-[#2a2f3d]">
          <View 
            className="bg-[#4f7cff] h-full rounded-full" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#4f7cff" />
          <Text className="text-[#8a8fa3] mt-4 text-center font-dmsans">
            Designing a challenging question for you...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text className="text-white mt-4 text-center font-bold text-lg mb-6">{error}</Text>
          <TouchableOpacity onPress={fetchNextQuestion} className="bg-[#4f7cff] py-3 px-8 rounded-xl flex-row items-center">
            <Ionicons name="refresh" size={18} color="#ffffff" />
            <Text className="text-white font-bold ml-2">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : questionData && (
        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          <Text className="text-white text-2xl font-bold font-syne mb-8 leading-9">
            {questionData.question}
          </Text>

          <View className="mb-6">
            {questionData.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = showExplanation && idx === questionData.correct;
              const isWrong = showExplanation && isSelected && !isCorrect;
              
              let borderColor = 'border-[#2a2f3d]';
              let bgColor = 'bg-[#161920]';
              let icon = null;

              if (showExplanation) {
                if (isCorrect) {
                  borderColor = 'border-green-500';
                  bgColor = 'bg-green-500/10';
                  icon = <Ionicons name="checkmark-circle" size={24} color="#22c55e" />;
                } else if (isWrong) {
                  borderColor = 'border-red-500';
                  bgColor = 'bg-red-500/10';
                  icon = <Ionicons name="close-circle" size={24} color="#ef4444" />;
                }
              } else if (isSelected) {
                borderColor = 'border-[#4f7cff]';
                bgColor = 'bg-[#4f7cff]/10';
              }

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectOption(idx)}
                  activeOpacity={0.7}
                  disabled={showExplanation}
                  className={`p-5 rounded-2xl mb-4 border-2 flex-row items-center justify-between ${borderColor} ${bgColor}`}
                >
                  <Text className={`text-base font-dmsans flex-1 pr-4 leading-6 ${showExplanation && (isCorrect || isWrong) ? 'text-white' : 'text-[#e2e8f0]'}`}>
                    {option}
                  </Text>
                  {icon}
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && (
            <View className="bg-[#161920] p-5 rounded-2xl border border-[#2a2f3d] mb-8">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#4f7cff" />
                <Text className="text-white font-bold font-syne text-lg ml-2">Explanation</Text>
              </View>
              <Text className="text-[#8a8fa3] text-base font-dmsans leading-6">
                {questionData.explanation}
              </Text>
            </View>
          )}

          {showExplanation && (
            <TouchableOpacity 
              onPress={handleNextQuestion}
              className="bg-[#4f7cff] py-4 rounded-2xl flex-row items-center justify-center mb-10 shadow-lg shadow-[#4f7cff]/30"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg font-syne mr-2">
                {questionIndex + 1 >= TOTAL_QUESTIONS ? "Finish Quiz" : "Next Question"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
