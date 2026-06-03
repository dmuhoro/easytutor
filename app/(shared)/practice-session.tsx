import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QuizEngine } from '../../components/QuizEngine';
import { QuestionBankItem, savePracticeSession } from '../../lib/questionBank';
import { track } from '../../lib/analytics';
import { useAuthStore } from '../../store/authStore';
import { updateMastery } from '../../lib/mastery';
import { recordPracticeMomentum } from '../../lib/streaks';
import {
  buildAdaptiveQuestionSet,
  describeSessionDifficulty,
  DifficultyLevel,
  formatDifficultyLabel,
  getRecommendedDifficulty,
  resolveTopicMasteryPercent,
  trackAdaptiveDifficultyChanged,
  trackAdaptiveSessionStarted,
} from '../../lib/adaptiveDifficulty';

type SessionInsight = {
  currentPrimary: DifficultyLevel;
  currentMixLabel: string;
  nextPrimary: DifficultyLevel;
  masteryPercent: number;
  scorePct: number;
};

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const subject = params.subject as string;
  const topic = params.topic as string;
  const difficulty = params.difficulty as string;

  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionPrimary, setSessionPrimary] = useState<DifficultyLevel>('medium');
  const [showInsight, setShowInsight] = useState(false);
  const [sessionInsight, setSessionInsight] = useState<SessionInsight | null>(null);

  useEffect(() => {
    void loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const adaptive = await buildAdaptiveQuestionSet(user?.id, subject, topic, 10);
    setQuestions(adaptive.questions);
    setSessionPrimary(adaptive.primary);

    trackAdaptiveSessionStarted({
      user_id: user?.id,
      subject,
      topic,
      mastery_percent: adaptive.masteryPercent,
      primary_difficulty: adaptive.primary,
      question_count: adaptive.questions.length,
    });

    setLoading(false);
  };

  const handleFinish = async (score: number, total: number) => {
    const sessionTopic = topic && topic !== 'all' ? topic : 'Mixed Topics';
    const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;
    const beforeMastery = await resolveTopicMasteryPercent(user?.id, subject, topic);
    const beforeProfile = getRecommendedDifficulty(beforeMastery);

    track('practice_completed', {
      subject,
      topic,
      difficulty: sessionPrimary,
      score,
      total,
      adaptive: true,
    });

    await savePracticeSession({
      user_id: user?.id,
      subject,
      topic: sessionTopic,
      difficulty: sessionPrimary,
      score,
    });

    await updateMastery(user?.id, subject, sessionTopic, score, total);
    await recordPracticeMomentum(user?.id);

    const afterMastery = await resolveTopicMasteryPercent(user?.id, subject, topic);
    const afterProfile = getRecommendedDifficulty(afterMastery);

    trackAdaptiveDifficultyChanged({
      user_id: user?.id,
      subject,
      topic,
      previous_primary: beforeProfile.primary,
      next_primary: afterProfile.primary,
      previous_mastery: beforeMastery,
      next_mastery: afterMastery,
    });

    const mixLabel = describeSessionDifficulty({
      easy: questions.filter((q) => q.difficulty === 'easy').length,
      medium: questions.filter((q) => q.difficulty === 'medium').length,
      hard: questions.filter((q) => q.difficulty === 'hard').length,
    });

    setSessionInsight({
      currentPrimary: beforeProfile.primary,
      currentMixLabel: mixLabel,
      nextPrimary: afterProfile.primary,
      masteryPercent: afterMastery,
      scorePct,
    });
  };

  const handleQuizContinue = () => {
    if (sessionInsight) {
      setShowInsight(true);
      return;
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (showInsight && sessionInsight) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.insightContent}>
        <Text style={styles.insightTitle}>Session Complete</Text>
        <Text style={styles.insightSubtitle}>Score: {sessionInsight.scorePct}%</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Difficulty</Text>
          <Text style={styles.cardValue}>{formatDifficultyLabel(sessionInsight.currentPrimary)}</Text>
          <Text style={styles.cardHint}>{sessionInsight.currentMixLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Recommended Next Difficulty</Text>
          <Text style={styles.cardValue}>{formatDifficultyLabel(sessionInsight.nextPrimary)}</Text>
          <Text style={styles.cardHint}>Mastery: {sessionInsight.masteryPercent}%</Text>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <QuizEngine
        subjectName={subject}
        topicName={topic === 'all' ? 'Mixed Topics' : topic}
        totalQuestions={questions.length}
        customQuestions={questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct: q.options.indexOf(q.correct_answer) >= 0 ? q.options.indexOf(q.correct_answer) : 0,
          explanation: q.explanation || '',
        }))}
        onFinish={handleFinish}
        onContinue={handleQuizContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f12',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0f12',
  },
  insightContent: {
    padding: 20,
    paddingTop: 48,
  },
  insightTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightSubtitle: {
    color: '#9eb8ff',
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#161920',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2f3d',
  },
  cardLabel: {
    color: '#8a8fa3',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardHint: {
    color: '#cfd6ec',
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: '#4f7cff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
