import { z } from 'zod';

// 1. Quiz Question Schema
export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().min(0).max(3),
  explanation: z.string(),
});

// 2. Study Roadmap Schema
export const RoadmapTaskSchema = z.string();

export const RoadmapDaySchema = z.object({
  day: z.number(),
  title: z.string(),
  tasks: z.array(RoadmapTaskSchema).min(1),
});

export const RoadmapSchema = z.object({
  title: z.string(),
  days: z.array(RoadmapDaySchema).length(7),
});

export type ValidatedQuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type ValidatedRoadmap = z.infer<typeof RoadmapSchema>;
