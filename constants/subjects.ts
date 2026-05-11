/**
 * SINGLE SOURCE OF TRUTH — Subjects
 * IDs are stable kebab strings that ARE the subjects.id TEXT PK in the DB.
 * This is the ONLY place subjects are defined.
 */
export type SubjectLevel = 'high_school' | 'university' | 'self_directed';

export interface SubjectDef {
  id: string;
  name: string;
  level: SubjectLevel;
  icon: string;
  description: string;
  kicd_ref?: string;
}

export const SUBJECTS: SubjectDef[] = [
  // High School (KCSE)
  { id: 'hs-math',        name: 'Mathematics',                  level: 'high_school', icon: '🧮', description: 'KCSE Mathematics (Form 1–4)',              kicd_ref: 'KICD/MAT/001' },
  { id: 'hs-physics',     name: 'Physics',                      level: 'high_school', icon: '⚛️', description: 'KCSE Physics (Form 1–4)',                  kicd_ref: 'KICD/PHY/002' },
  { id: 'hs-chemistry',   name: 'Chemistry',                    level: 'high_school', icon: '🧪', description: 'KCSE Chemistry (Form 1–4)',                kicd_ref: 'KICD/CHE/003' },
  { id: 'hs-biology',     name: 'Biology',                      level: 'high_school', icon: '🧬', description: 'KCSE Biology (Form 1–4)',                  kicd_ref: 'KICD/BIO/004' },
  { id: 'hs-english',     name: 'English',                      level: 'high_school', icon: '📖', description: 'KCSE English (Form 1–4)',                  kicd_ref: 'KICD/ENG/005' },
  { id: 'hs-kiswahili',   name: 'Kiswahili',                    level: 'high_school', icon: '🇰🇪', description: 'KCSE Kiswahili (Form 1–4)',               kicd_ref: 'KICD/KIS/006' },
  { id: 'hs-history',     name: 'History & Government',         level: 'high_school', icon: '🏛️', description: 'KCSE History & Government (Form 1–4)',    kicd_ref: 'KICD/HIS/007' },
  { id: 'hs-geography',   name: 'Geography',                    level: 'high_school', icon: '🌍', description: 'KCSE Geography (Form 1–4)',                kicd_ref: 'KICD/GEO/008' },
  { id: 'hs-business',    name: 'Business Studies',             level: 'high_school', icon: '💼', description: 'KCSE Business Studies (Form 1–4)',         kicd_ref: 'KICD/BUS/009' },
  { id: 'hs-cre',         name: 'Christian Religious Education',level: 'high_school', icon: '✝️', description: 'KCSE CRE (Form 1–4)',                     kicd_ref: 'KICD/CRE/010' },
  { id: 'hs-technical',   name: 'Technical Drawing',            level: 'high_school', icon: '📐', description: 'KCSE Technical Drawing (Form 1–4)',        kicd_ref: 'KICD/TEC/011' },
  { id: 'hs-computer',    name: 'Computer Studies',             level: 'high_school', icon: '💻', description: 'KCSE Computer Studies (Form 1–4)',         kicd_ref: 'KICD/COM/012' },
  { id: 'hs-agriculture', name: 'Agriculture',                  level: 'high_school', icon: '🌾', description: 'KCSE Agriculture (Form 1–4)',              kicd_ref: 'KICD/AGR/013' },
  { id: 'hs-home-science',name: 'Home Science',                 level: 'high_school', icon: '🏠', description: 'KCSE Home Science (Form 1–4)',             kicd_ref: 'KICD/HOM/014' },
  // University
  { id: 'uni-engineering',      name: 'Engineering',              level: 'university', icon: '⚙️', description: 'Degree-level Engineering' },
  { id: 'uni-computer-science', name: 'Computer Science',         level: 'university', icon: '🖥️', description: 'Degree-level Computer Science' },
  { id: 'uni-medicine',         name: 'Medicine & Health Sciences',level: 'university', icon: '🩺', description: 'Degree-level Medicine' },
  { id: 'uni-law',              name: 'Law',                      level: 'university', icon: '⚖️', description: 'Degree-level Law' },
  { id: 'uni-business',         name: 'Business & Economics',     level: 'university', icon: '📊', description: 'Degree-level Business & Economics' },
  // Self-Directed
  { id: 'sd-automotive',       name: 'Automotive Engineering', level: 'self_directed', icon: '🚗', description: 'Automotive systems and engineering' },
  { id: 'sd-computer-science', name: 'Computer Science Pro',   level: 'self_directed', icon: '💻', description: 'Self-directed CS from fundamentals to advanced' },
];

export const getSubjectById = (id: string): SubjectDef | undefined =>
  SUBJECTS.find((s) => s.id === id);

export const getSubjectsByLevel = (level: SubjectLevel): SubjectDef[] =>
  SUBJECTS.filter((s) => s.level === level);
