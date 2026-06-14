import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeAndCoach } from '../lib/learningCoachEngine';
import { getSubjectMastery } from '../lib/mastery';
import { getAllPerformanceProfiles } from '../lib/performanceEngine';
import { getWeaknessPredictionStore } from '../lib/weaknessPredictionEngine';
import { getLearningTrendOverview } from '../lib/trendEngine';
import { getAllKnowledgeNodes, getActiveKnowledgePath } from '../lib/knowledgeGraphEngine';
import { LearningIdentity } from '../lib/learningIdentityEngine';

vi.mock('../lib/mastery');
vi.mock('../lib/performanceEngine');
vi.mock('../lib/weaknessPredictionEngine');
vi.mock('../lib/trendEngine');
vi.mock('../lib/knowledgeGraphEngine');
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));
vi.mock('../lib/supabaseOps', () => ({
  logSupabaseError: vi.fn(),
}));

describe('learningCoachEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects strengths from high mastery topics', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'university',
      goals: ['Master Calculus'],
      interests: ['Math'],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Algebra', mastery_percent: 85, attempts: 10, correct_answers: 85, total_answers: 100 },
      { subject: 'Math', topic: 'Arithmetic', mastery_percent: 90, attempts: 5, correct_answers: 90, total_answers: 100 },
      { subject: 'Math', topic: 'Geometry', mastery_percent: 45, attempts: 8, correct_answers: 45, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([
      {
        subject: 'Math',
        fluency_level: 'fluent',
        confidence_score: 80,
        accuracy_percent: 85,
        average_response_time_ms: 3000,
      },
    ] as any);

    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({
      trend_summary: 'Stable performance',
      weekly: { trend_summary: 'Improving' },
    } as any);

    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.strengths[0].topic).toBe('Arithmetic');
    expect(analysis.strengths[0].mastery_percent).toBe(90);
  });

  it('detects weaknesses from low mastery topics', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'secondary',
      goals: ['Improve scores'],
      interests: [],
      preferred_learning_style: 'text',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Calculus', mastery_percent: 30, attempts: 10, correct_answers: 30, total_answers: 100 },
      { subject: 'Math', topic: 'Algebra', mastery_percent: 55, attempts: 8, correct_answers: 55, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([
        {
          topicId: 'Calculus',
          subjectId: 'Math',
          riskScore: 80,
          severity: 'HIGH',
          confidence: 85,
          reason: 'Focus on foundational calculus concepts',
          intervention: 'Review prerequisites and core concepts',
        },
      ]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({
      trend_summary: 'Declining performance',
    } as any);

    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.weaknesses.length).toBeGreaterThan(0);
    expect(analysis.weaknesses[0].topic).toBe('Calculus');
    expect(analysis.weaknesses[0].severity).toBe('HIGH');
  });

  it('generates coaching strategies based on weaknesses', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'university',
      goals: ['Pass Calculus'],
      interests: ['Mathematics'],
      preferred_learning_style: 'visual',
      target_outcomes: ['High marks'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Calculus', mastery_percent: 25, attempts: 5, correct_answers: 25, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([
        {
          topicId: 'Calculus',
          subjectId: 'Math',
          riskScore: 95,
          severity: 'CRITICAL',
          confidence: 90,
          reason: 'Urgent intervention needed',
          intervention: 'Focus on foundational calculus concepts',
        },
      ]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({} as any);
    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.coaching_strategies.length).toBeGreaterThan(0);
    const recoveryStrategy = analysis.coaching_strategies.find(s => s.strategy_type === 'recovery');
    expect(recoveryStrategy).toBeDefined();
    expect(recoveryStrategy?.urgency).toBe('critical');
  });

  it('predicts milestones based on mastery trajectory', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'university',
      goals: [],
      interests: [],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Algebra', mastery_percent: 65, attempts: 10, correct_answers: 65, total_answers: 100 },
      { subject: 'Math', topic: 'Geometry', mastery_percent: 70, attempts: 8, correct_answers: 70, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({
      weekly: {
        metrics: {
          accuracy_score: { improvement_percent: 10 }
        }
      }
    } as any);

    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.milestone_predictions.length).toBeGreaterThan(0);
    const algebraMilestone = analysis.milestone_predictions.find(m => m.topic === 'Algebra');
    expect(algebraMilestone).toBeDefined();
    expect(algebraMilestone?.estimated_days_to_mastery).toBeGreaterThan(0);
    expect(algebraMilestone?.likely_improvement_rate).toBe(10);
    expect(algebraMilestone?.expected_risk_reduction).toBe(10);
    expect(algebraMilestone?.confidence_percent).toBeGreaterThan(0);
  });

  it('detects mastery gaps for topics with high attempts but low mastery', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'secondary',
      goals: [],
      interests: [],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Trigonometry', mastery_percent: 40, attempts: 10, correct_answers: 40, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);
    vi.mocked(getLearningTrendOverview).mockResolvedValue({} as any);
    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    const masteryGap = analysis.root_causes.find(c => c.cause_type === 'mastery_gap');
    expect(masteryGap).toBeDefined();
    expect(masteryGap?.topic).toBe('Trigonometry');
    expect(masteryGap?.severity).toBe('HIGH');
  });

  it('detects behavior inconsistency from trend data', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'secondary',
      goals: [],
      interests: [],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([]);
    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);
    
    vi.mocked(getLearningTrendOverview).mockResolvedValue({
      weekly: {
        session_completion_change: -5,
      }
    } as any);

    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    const behaviorInconsistency = analysis.root_causes.find(c => c.cause_type === 'behavior_inconsistency');
    expect(behaviorInconsistency).toBeDefined();
    expect(behaviorInconsistency?.severity).toBe('MEDIUM');
  });

  it('generates opportunities and risks', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'university',
      goals: [],
      interests: [],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'Math', topic: 'Calculus', mastery_percent: 75, attempts: 5, correct_answers: 75, total_answers: 100 },
    ]);

    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([
        {
          topicId: 'Physics',
          subjectId: 'Science',
          riskScore: 85,
          severity: 'CRITICAL',
          reason: 'Rapid decline in accuracy',
          intervention: 'Remedial session needed',
        },
      ]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({} as any);
    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.opportunities.length).toBeGreaterThan(0);
    expect(analysis.opportunities[0]).toContain('Calculus');
    expect(analysis.risks.length).toBeGreaterThan(0);
    expect(analysis.risks[0]).toContain('Physics');
  });

  it('generates personalized coaching summary with prerequisite insight', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'self_directed',
      goals: ['Learn ML'],
      interests: ['AI'],
      preferred_learning_style: 'text',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(getSubjectMastery).mockResolvedValue([
      { subject: 'CS', topic: 'Machine Learning', mastery_percent: 50, attempts: 5, correct_answers: 50, total_answers: 100 },
      { subject: 'Math', topic: 'Linear Algebra', mastery_percent: 75, attempts: 8, correct_answers: 75, total_answers: 100 },
    ]);

    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);

    vi.mocked(getLearningTrendOverview).mockResolvedValue({
      weekly: { trend_summary: 'Improving trend' },
    } as any);

    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map([
      ['Fractions', { id: 'Fractions', title: 'Fractions', difficulty_level: 20, prerequisites: [], category: 'Math' } as any],
      ['Algebra', { id: 'Algebra', title: 'Algebra', difficulty_level: 50, prerequisites: ['Fractions'], category: 'Math' } as any],
    ]));
    vi.mocked(getActiveKnowledgePath).mockResolvedValue({ path_goal: 'Algebra' } as any);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.coaching_summary.length).toBeGreaterThan(0);
    expect(analysis.coaching_summary).toContain('Linear Algebra');
    expect(analysis.coaching_summary).toContain('prerequisite weakness');
  });

  it('calculates analysis confidence based on data availability', async () => {
    const identity: LearningIdentity = {
      user_id: 'user-1',
      learner_type: 'university',
      goals: [],
      interests: [],
      preferred_learning_style: 'visual',
      target_outcomes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Rich data scenario
    const richMasteryData = Array.from({ length: 10 }, (_, i) => ({
      subject: 'Math',
      topic: `Topic${i}`,
      mastery_percent: Math.random() * 100,
      attempts: Math.floor(Math.random() * 20),
      correct_answers: Math.floor(Math.random() * 100),
      total_answers: 100,
    }));

    vi.mocked(getSubjectMastery).mockResolvedValue(richMasteryData);
    vi.mocked(getAllPerformanceProfiles).mockResolvedValue([]);
    vi.mocked(getWeaknessPredictionStore).mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue([]),
    } as any);
    vi.mocked(getLearningTrendOverview).mockResolvedValue({} as any);
    vi.mocked(getAllKnowledgeNodes).mockResolvedValue(new Map());
    vi.mocked(getActiveKnowledgePath).mockResolvedValue(null);

    const analysis = await analyzeAndCoach('user-1', identity);

    expect(analysis.confidence_in_analysis).toBeGreaterThan(50);
  });
});
