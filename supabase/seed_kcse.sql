-- Seed: 12 KCSE Subjects based on KICD Syllabus
-- Created: 2026-04-03
-- Purpose: Implement Phase 1 Task 6 of the EasyTutor v1.0 Build Directive

-- 1. Insert 12 KCSE Subjects
DO $$
DECLARE
    math_id UUID;
    biology_id UUID;
    chemistry_id UUID;
    physics_id UUID;
    history_id UUID;
    geo_id UUID;
    cre_id UUID;
    kiswahili_id UUID;
    english_id UUID;
    bus_studies_id UUID;
    agri_id UUID;
    comp_studies_id UUID;
BEGIN
    -- Subjects
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Mathematics', '🧮', 'high_school', 'KCSE Mathematics Syllabus (Form 1–4)', 'KICD/MAT/001') RETURNING id INTO math_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Biology', '🧬', 'high_school', 'KCSE Biology Syllabus (Form 1–4)', 'KICD/BIO/002') RETURNING id INTO biology_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Chemistry', '🧪', 'high_school', 'KCSE Chemistry Syllabus (Form 1–4)', 'KICD/CHE/003') RETURNING id INTO chemistry_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Physics', '⚙️', 'high_school', 'KCSE Physics Syllabus (Form 1–4)', 'KICD/PHY/004') RETURNING id INTO physics_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('History & Government', '🏛️', 'high_school', 'KCSE History Syllabus (Form 1–4)', 'KICD/HIS/005') RETURNING id INTO history_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Geography', '🌍', 'high_school', 'KCSE Geography Syllabus (Form 1–4)', 'KICD/GEO/006') RETURNING id INTO geo_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('CRE', '📖', 'high_school', 'KCSE CRE Syllabus (Form 1–4)', 'KICD/CRE/007') RETURNING id INTO cre_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Kiswahili', '💬', 'high_school', 'KCSE Kiswahili Syllabus (Form 1–4)', 'KICD/KIS/008') RETURNING id INTO kiswahili_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('English', '🖊️', 'high_school', 'KCSE English Syllabus (Form 1–4)', 'KICD/ENG/009') RETURNING id INTO english_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Business Studies', '💼', 'high_school', 'KCSE Business Studies Syllabus (Form 1–4)', 'KICD/BUS/010') RETURNING id INTO bus_studies_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Agriculture', '🚜', 'high_school', 'KCSE Agriculture Syllabus (Form 1–4)', 'KICD/AGR/011') RETURNING id INTO agri_id;
    INSERT INTO subjects (name, icon, level, description, kicd_ref) VALUES
        ('Computer Studies', '💻', 'high_school', 'KCSE Computer Studies Syllabus (Form 1–4)', 'KICD/COM/012') RETURNING id INTO comp_studies_id;

    -- Topics for Mathematics
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (math_id, 'Natural Numbers', 'Form 1', 1),
        (math_id, 'Factors', 'Form 1', 2),
        (math_id, 'Divisibility Tests', 'Form 1', 3),
        (math_id, 'GCD & LCM', 'Form 1', 4),
        (math_id, 'Integers', 'Form 1', 5),
        (math_id, 'Fractions', 'Form 1', 6),
        (math_id, 'Decimals', 'Form 1', 7),
        (math_id, 'Squares & Square Roots', 'Form 1', 8),
        (math_id, 'Algebraic Expressions', 'Form 1', 9),
        (math_id, 'Linear Equations', 'Form 1', 10),
        -- Form 2
        (math_id, 'Indices & Logarithms', 'Form 2', 11),
        (math_id, 'Gradient & Equations of Lines', 'Form 2', 12),
        (math_id, 'Similarities & Enlargement', 'Form 2', 13),
        (math_id, 'Trigonometry I', 'Form 2', 14),
        (math_id, 'Surds', 'Form 2', 15),
        -- Form 3
        (math_id, 'Quadratic Expressions', 'Form 3', 16),
        (math_id, 'Approximation & Errors', 'Form 3', 17),
        (math_id, 'Trigonometry II', 'Form 3', 18),
        (math_id, 'Commercial Arithmetic II', 'Form 3', 19),
        (math_id, 'Circles, Chords & Tangents', 'Form 3', 20),
        -- Form 4
        (math_id, 'Matrices & Transformations', 'Form 4', 21),
        (math_id, 'Statistics II', 'Form 4', 22),
        (math_id, 'Three Dimensional Geometry', 'Form 4', 23),
        (math_id, 'Calculus I & II', 'Form 4', 24);

    -- Topics for Biology
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (biology_id, 'Introduction to Biology', 'Form 1', 1),
        (biology_id, 'Classification I', 'Form 1', 2),
        (biology_id, 'The Cell', 'Form 1', 3),
        (biology_id, 'Cell Physiology', 'Form 1', 4),
        (biology_id, 'Nutrition in Plants & Animals', 'Form 1', 5),
        -- Form 2
        (biology_id, 'Transport in Plants & Animals', 'Form 2', 6),
        (biology_id, 'Gaseous Exchange', 'Form 2', 7),
        (biology_id, 'Respiration', 'Form 2', 8),
        (biology_id, 'Excretion & Homeostasis', 'Form 2', 9),
        -- Form 3
        (biology_id, 'Classification II', 'Form 3', 10),
        (biology_id, 'Ecology', 'Form 3', 11),
        (biology_id, 'Reproduction', 'Form 3', 12),
        (biology_id, 'Growth & Development', 'Form 3', 13),
        -- Form 4
        (biology_id, 'Genetics', 'Form 4', 14),
        (biology_id, 'Evolution', 'Form 4', 15),
        (biology_id, 'Irritability', 'Form 4', 16);

    -- Topics for Physics
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (physics_id, 'Introduction to Physics', 'Form 1', 1),
        (physics_id, 'Measurement I', 'Form 1', 2),
        (physics_id, 'Force', 'Form 1', 3),
        (physics_id, 'Pressure', 'Form 1', 4),
        (physics_id, 'Particulate Nature of Matter', 'Form 1', 5),
        -- Form 2
        (physics_id, 'Magnetism', 'Form 2', 6),
        (physics_id, 'Measurement II', 'Form 2', 7),
        (physics_id, 'Turning Effect of a Force', 'Form 2', 8),
        (physics_id, 'Equilibrium & Centre of Gravity', 'Form 2', 9),
        (physics_id, 'Sound', 'Form 2', 10),
        -- Form 3
        (physics_id, 'Linear Motion', 'Form 3', 11),
        (physics_id, 'Newton''s Laws of Motion', 'Form 3', 12),
        (physics_id, 'Work, Energy, Power & Machines', 'Form 3', 13),
        (physics_id, 'Gas Laws', 'Form 3', 14),
        -- Form 4
        (physics_id, 'Thin Lenses', 'Form 4', 15),
        (physics_id, 'Uniform Circular Motion', 'Form 4', 16),
        (physics_id, 'Floating & Sinking', 'Form 4', 17),
        (physics_id, 'Photoelectric Effect', 'Form 4', 18),
        (physics_id, 'Radioactivity', 'Form 4', 19);

    -- Topics for Computer Studies
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (comp_studies_id, 'Introduction to Computers', 'Form 1', 1),
        (comp_studies_id, 'Computer Systems', 'Form 1', 2),
        (comp_studies_id, 'Operating Systems', 'Form 1', 3),
        -- Form 2
        (comp_studies_id, 'Word Processors', 'Form 2', 4),
        (comp_studies_id, 'Spreadsheets', 'Form 2', 5),
        (comp_studies_id, 'Databases', 'Form 2', 6),
        -- Form 3
        (comp_studies_id, 'Desktop Publishing', 'Form 3', 7),
        (comp_studies_id, 'Networking & Data Communication', 'Form 3', 8),
        (comp_studies_id, 'Data Integrity & Security', 'Form 3', 9),
        (comp_studies_id, 'Information Coding', 'Form 3', 10),
        (comp_studies_id, 'Data Processing', 'Form 3', 11),
        -- Form 4
        (comp_studies_id, 'Elementary Programming', 'Form 4', 12),
        (comp_studies_id, 'System Development', 'Form 4', 13),
        (comp_studies_id, 'Impact/Ethics of ICT', 'Form 4', 14);

END $$;
