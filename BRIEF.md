# EasyTutor — Project Brief

## What this is
A mobile-first self-learning platform for self-taught individuals.
Built by a Kenyan Automotive Engineering student.
Target users: anyone learning anything by themselves.

## Current phase (Phase 1 — Exam Sprint)
Focus ONLY on the learning app MVP.
Do NOT build trading, journaling, or file storage features yet.

## Tech stack — do not deviate without asking
- React Native + Expo SDK 52
- Expo Router (file-based navigation)
- NativeWind (Tailwind for React Native)
- Supabase (database + auth)
- Zustand + AsyncStorage (state + persistence)
- Anthropic API claude-sonnet-4-6 (primary AI)
- Ollama localhost:11434 (offline AI fallback)
- TypeScript everywhere — never use `any`

## Design
- Background: #0d0f12
- Surface: #161920
- Accent: #4f7cff
- Fonts: Syne (headings), DM Sans (body)

## Agent rules
- Small focused files, never one giant file
- NativeWind classes only, no inline styles
- All errors must show user-friendly messages
- Never install unapproved libraries without asking
- Never skip TypeScript types
