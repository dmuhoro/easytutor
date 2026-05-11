-- Sprint 6 Scholarly Seed Data: v1.0 Multi-Portal AI Learning OS

-- 1. High School Subjects (Task 6.1)
INSERT INTO subjects (name, level, icon, description, kicd_ref) VALUES
('Mathematics', 'high_school', 'calculator', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-01'),
('Biology', 'high_school', 'leaf', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-02'),
('Chemistry', 'high_school', 'flask', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-03'),
('Physics', 'high_school', 'pulse', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-04'),
('History and Government', 'high_school', 'library', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-05'),
('Geography', 'high_school', 'earth', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-06'),
('Christian Religious Education', 'high_school', 'book', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-07'),
('Kiswahili', 'high_school', 'language', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-08'),
('English', 'high_school', 'create', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-09'),
('Business Studies', 'high_school', 'cash', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-10'),
('Agriculture', 'high_school', 'nutrition', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-11'),
('Computer Studies', 'high_school', 'desktop', 'KCSE and CBC curriculum, Kenya syllabus', 'KICD-HS-12')
ON CONFLICT (id) DO NOTHING;

-- 2. Mathematics Topics (8 topics, Form 1–4 Progression)
DO $$
DECLARE
  math_id UUID := (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1);
BEGIN
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (math_id, 'Natural Numbers', 'Form 1', 1),
  (math_id, 'Factors', 'Form 1', 2),
  (math_id, 'Linear Equations', 'Form 2', 3),
  (math_id, 'Quadratic Expressions', 'Form 2', 4),
  (math_id, 'Trigonometry II', 'Form 3', 5),
  (math_id, 'Quadratic Equations II', 'Form 3', 6),
  (math_id, 'Matrices and Transformations', 'Form 4', 7),
  (math_id, 'Calculus - Differentiation', 'Form 4', 8);
END $$;

-- 3. Biology Topics (8 topics, Form 1–4 Progression)
DO $$
DECLARE
  bio_id UUID := (SELECT id FROM subjects WHERE name = 'Biology' LIMIT 1);
BEGIN
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (bio_id, 'Introduction to Biology', 'Form 1', 1),
  (bio_id, 'Classification I', 'Form 1', 2),
  (bio_id, 'Transport in Plants and Animals', 'Form 2', 3),
  (bio_id, 'Excretion and Homeostasis', 'Form 2', 4),
  (bio_id, 'Classification II', 'Form 3', 5),
  (bio_id, 'Reproduction in Plants and Animals', 'Form 3', 6),
  (bio_id, 'Genetics', 'Form 4', 7),
  (bio_id, 'Evolution', 'Form 4', 8);
END $$;

-- (Continuing for other High School subjects)
DO $$
DECLARE
  chem_id UUID := (SELECT id FROM subjects WHERE name = 'Chemistry' LIMIT 1);
  phys_id UUID := (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1);
  hist_id UUID := (SELECT id FROM subjects WHERE name = 'History and Government' LIMIT 1);
  geog_id UUID := (SELECT id FROM subjects WHERE name = 'Geography' LIMIT 1);
  cre_id  UUID := (SELECT id FROM subjects WHERE name = 'Christian Religious Education' LIMIT 1);
  kisw_id UUID := (SELECT id FROM subjects WHERE name = 'Kiswahili' LIMIT 1);
  eng_id  UUID := (SELECT id FROM subjects WHERE name = 'English' LIMIT 1);
  bus_id  UUID := (SELECT id FROM subjects WHERE name = 'Business Studies' LIMIT 1);
  agri_id UUID := (SELECT id FROM subjects WHERE name = 'Agriculture' LIMIT 1);
  comp_id UUID := (SELECT id FROM subjects WHERE name = 'Computer Studies' LIMIT 1);
BEGIN
  -- Chemistry Topics
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (chem_id, 'Introduction to Chemistry', 'Form 1', 1), (chem_id, 'Structure of Atom', 'Form 2', 2),
  (chem_id, 'Gas Laws', 'Form 3', 3), (chem_id, 'Organic Chemistry II', 'Form 4', 4),
  (chem_id, 'Radioactivity', 'Form 4', 5), (chem_id, 'Acids, Bases and Salts', 'Form 1', 6),
  (chem_id, 'Chemical Familes', 'Form 2', 7), (chem_id, 'Electrochemistry', 'Form 4', 8);

  -- Physics Topics
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (phys_id, 'Measurement I', 'Form 1', 1), (phys_id, 'Newton''s Laws', 'Form 2', 2),
  (phys_id, 'Current Electricity II', 'Form 3', 3), (phys_id, 'Photoelectric Effect', 'Form 4', 4),
  (phys_id, 'Radioactivity', 'Form 4', 5), (phys_id, 'Work, Energy, Power', 'Form 3', 6),
  (phys_id, 'Magnetic Effect of Electric Current', 'Form 2', 7), (phys_id, 'Floatation', 'Form 4', 8);

  -- History & Gov
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (hist_id, 'Introduction to History', 'Form 1', 1), (hist_id, 'Agrarian Revolution', 'Form 2', 2),
  (hist_id, 'European Expansion in Africa', 'Form 3', 3), (hist_id, 'World Wars', 'Form 4', 4),
  (hist_id, 'Devolved Government in Kenya', 'Form 4', 5), (hist_id, 'Social and Political Org in 19th Century', 'Form 1', 6),
  (hist_id, 'Colonial System in Kenya', 'Form 3', 7), (hist_id, 'International Relations', 'Form 4', 8);

  -- Geography
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (geog_id, 'Introduction to Geography', 'Form 1', 1), (geog_id, 'Internal Land Forming Processes', 'Form 2', 2),
  (geog_id, 'Statistical Methods', 'Form 3', 3), (geog_id, 'Industry in Kenya', 'Form 4', 4),
  (geog_id, 'Weathering', 'Form 2', 5), (geog_id, 'Flora and Fauna', 'Form 3', 6),
  (geog_id, 'Agriculture in Kenya', 'Form 4', 7), (geog_id, 'Settlement', 'Form 4', 8);

  -- CRE
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (cre_id, 'Creation and Fall of Man', 'Form 1', 1), (cre_id, 'Old Testament Prophets', 'Form 2', 2),
  (cre_id, 'Parables of Jesus', 'Form 3', 3), (cre_id, 'Christianity and Law', 'Form 4', 4),
  (cre_id, 'African Religious Heritage', 'Form 1', 5), (cre_id, 'The Life of Jesus', 'Form 2', 6),
  (cre_id, 'The Holy Spirit', 'Form 3', 7), (cre_id, 'Modern Moral Issues', 'Form 4', 8);

  -- Kiswahili
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (kisw_id, 'Kusikiliza na Kuzungumza', 'Form 1', 1), (kisw_id, 'Sarufi na Matumizi ya Lugha', 'Form 2', 2),
  (kisw_id, 'Isimu Jamii', 'Form 3', 3), (kisw_id, 'Fasihi Simulizi', 'Form 4', 4),
  (kisw_id, 'Kusoma kwa kina', 'Form 1', 5), (kisw_id, 'Uandishi wa Insha', 'Form 2', 6),
  (kisw_id, 'Kueleza na Kufupisha', 'Form 3', 7), (kisw_id, 'Ngeli za Nomino', 'Form 1', 8);

  -- English
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (eng_id, 'Oral Skills', 'Form 1', 1), (eng_id, 'Grammar and Usage', 'Form 2', 2),
  (eng_id, 'Introduction to Literature', 'Form 3', 3), (eng_id, 'Advanced Composition', 'Form 4', 4),
  (eng_id, 'Listening Comprehension', 'Form 1', 5), (eng_id, 'Functional Writing', 'Form 2', 6),
  (eng_id, 'Analysis of SET Books', 'Form 3', 7), (eng_id, 'Poetry Analysis', 'Form 4', 8);

  -- Business Studies
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (bus_id, 'Introduction to Business', 'Form 1', 1), (bus_id, 'The Ledger', 'Form 2', 2),
  (bus_id, 'Product Life Cycle', 'Form 3', 3), (bus_id, 'Public Finance', 'Form 4', 4),
  (bus_id, 'Business Units', 'Form 1', 5), (bus_id, 'Marketing', 'Form 2', 6),
  (bus_id, 'International Trade', 'Form 3', 7), (bus_id, 'Money and Banking', 'Form 4', 8);

  -- Agriculture
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (agri_id, 'Introduction to Agriculture', 'Form 1', 1), (agri_id, 'Livestock Production I', 'Form 2', 2),
  (agri_id, 'Farm Power and Machinery', 'Form 3', 3), (agri_id, 'Agro-forestry', 'Form 4', 4),
  (agri_id, 'Soil Fertility', 'Form 1', 5), (agri_id, 'Crop Production I', 'Form 2', 6),
  (agri_id, 'Farm Accounts', 'Form 3', 7), (agri_id, 'Agricultural Marketing', 'Form 4', 8);

  -- Computer Studies (High School Version)
  INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
  (comp_id, 'Introduction to Computers', 'Form 1', 1), (comp_id, 'Operating Systems', 'Form 2', 2),
  (comp_id, 'Spreadsheets', 'Form 3', 3), (comp_id, 'Elementary Programming', 'Form 4', 4),
  (comp_id, 'Computer Hardware', 'Form 1', 5), (comp_id, 'Word Processing', 'Form 2', 6),
  (comp_id, 'Data Communication', 'Form 3', 7), (comp_id, 'System Development', 'Form 4', 8);
END $$;

-- 4. Computer Science (Self-Directed - Task 6.2)
INSERT INTO subjects (name, level, icon, description) VALUES
('Computer Science Pro', 'self_directed', 'code-slash', 'Learn anything, your way, no curriculum')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  cs_id UUID := (SELECT id FROM subjects WHERE name = 'Computer Science Pro' LIMIT 1);
BEGIN
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (cs_id, 'Introduction to Programming', 1),
  (cs_id, 'Data Structures and Algorithms', 2),
  (cs_id, 'Object-Oriented Programming', 3),
  (cs_id, 'Databases and SQL', 4),
  (cs_id, 'Networking Fundamentals', 5),
  (cs_id, 'Operating Systems', 6),
  (cs_id, 'Web Development Basics', 7),
  (cs_id, 'APIs and Backend Development', 8),
  (cs_id, 'Version Control with Git', 9),
  (cs_id, 'System Design Fundamentals', 10);
END $$;

-- 5. Automotive Engineering (Self-Directed - Task 6.3)
INSERT INTO subjects (name, level, icon, description) VALUES
('Automotive Engineering', 'self_directed', 'car-sport', 'Learn anything, your way, no curriculum')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  auto_id UUID := (SELECT id FROM subjects WHERE name = 'Automotive Engineering' LIMIT 1);
BEGIN
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (auto_id, 'Mathematics for Engineers', 1),
  (auto_id, 'Classical Mechanics and Dynamics', 2),
  (auto_id, 'Thermodynamics', 3),
  (auto_id, 'Electrical Systems and Electronics', 4),
  (auto_id, 'Engine Theory and Internal Combustion', 5),
  (auto_id, 'Fuel Systems and Injection', 6),
  (auto_id, 'Engine Management Systems', 7),
  (auto_id, 'ECU Architecture and Software', 8),
  (auto_id, 'Vehicle Diagnostics and OBD', 9),
  (auto_id, 'Performance Tuning Fundamentals', 10),
  (auto_id, 'Forced Induction and Turbocharging', 11),
  (auto_id, 'Chassis Dynamics and Suspension', 12),
  (auto_id, 'Vehicle Modification and Safety', 13);
END $$;

-- 6. University Subjects (Task 6.4)
INSERT INTO subjects (name, level, icon, description) VALUES
('Engineering', 'university', 'hammer', 'Degree-level subjects, local universities'),
('Computer Science Uni', 'university', 'apps', 'Degree-level subjects, local universities'),
('Medicine and Health Sciences', 'university', 'medical', 'Degree-level subjects, local universities'),
('Law', 'university', 'ribbon', 'Degree-level subjects, local universities'),
('Business and Economics', 'university', 'trending-up', 'Degree-level subjects, local universities'),
('Architecture', 'university', 'camera', 'Degree-level subjects, local universities'),
('Education', 'university', 'school', 'Degree-level subjects, local universities'),
('Agriculture Uni', 'university', 'leaf', 'Degree-level subjects, local universities')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  eng_id UUID := (SELECT id FROM subjects WHERE name = 'Engineering' LIMIT 1);
  cs_uni_id UUID := (SELECT id FROM subjects WHERE name = 'Computer Science Uni' LIMIT 1);
  med_id UUID := (SELECT id FROM subjects WHERE name = 'Medicine and Health Sciences' LIMIT 1);
  law_id UUID := (SELECT id FROM subjects WHERE name = 'Law' LIMIT 1);
  bus_uni_id UUID := (SELECT id FROM subjects WHERE name = 'Business and Economics' LIMIT 1);
  arch_id UUID := (SELECT id FROM subjects WHERE name = 'Architecture' LIMIT 1);
  edu_id UUID := (SELECT id FROM subjects WHERE name = 'Education' LIMIT 1);
  agri_uni_id UUID := (SELECT id FROM subjects WHERE name = 'Agriculture Uni' LIMIT 1);
BEGIN
  -- Engineering
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (eng_id, 'Calculus I', 1), (eng_id, 'Circuit Theory', 2), (eng_id, 'Mechanics', 3), (eng_id, 'Material Science', 4), (eng_id, 'Engineering Ethics', 5);
  
  -- Computer Science Uni
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (cs_uni_id, 'Discrete Mathematics', 1), (cs_uni_id, 'Programming I (Python)', 2), (cs_uni_id, 'Digital Logic', 3), (cs_uni_id, 'Computer Organization', 4), (cs_uni_id, 'Data Communication', 5);
  
  -- Medicine
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (med_id, 'Human Anatomy I', 1), (med_id, 'Medical Biochemistry', 2), (med_id, 'Medical Physiology', 3), (med_id, 'Cell Biology', 4), (med_id, 'Introduction to Clinical Medicine', 5);
  
  -- Law
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (law_id, 'Law of Torts', 1), (law_id, 'Contract Law', 2), (law_id, 'Constitution of Kenya', 3), (law_id, 'Legal Research and Writing', 4), (law_id, 'Family Law', 5);
  
  -- Business and Economics
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (bus_uni_id, 'Microeconomics I', 1), (bus_uni_id, 'Principles of Management', 2), (bus_uni_id, 'Financial Accounting I', 3), (bus_uni_id, 'Introduction to Marketing', 4), (bus_uni_id, 'Business Finance', 5);
  
  -- Architecture
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (arch_id, 'Architectural Design I', 1), (arch_id, 'History of Architecture', 2), (arch_id, 'Building Technology', 3), (arch_id, 'Theory of Structures', 4), (arch_id, 'Studio Design', 5);
  
  -- Education
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (edu_id, 'Psychology of Education', 1), (edu_id, 'History of Education', 2), (edu_id, 'Philosophy of Education', 3), (edu_id, 'Curriculum Development', 4), (edu_id, 'Special Needs Education', 5);
  
  -- Agriculture Uni
  INSERT INTO topics (subject_id, title, sort_order) VALUES
  (agri_uni_id, 'Principles of Crop Production', 1), (agri_uni_id, 'Livestock Nutrition', 2), (agri_uni_id, 'Soil Science', 3), (agri_uni_id, 'Agricultural Extension', 4), (agri_uni_id, 'Rural Sociology', 5);
END $$;
