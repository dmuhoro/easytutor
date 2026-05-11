-- Seed: Missing KCSE Topics for 8 subjects
-- Created: 2026-04-21
-- Purpose: Complete the High School content tree

DO $$
DECLARE
    chem_id UUID;
    hist_id UUID;
    geo_id UUID;
    cre_id UUID;
    kisw_id UUID;
    eng_id UUID;
    bus_id UUID;
    agri_id UUID;
BEGIN
    -- Retrieve IDs
    SELECT id INTO chem_id FROM subjects WHERE name = 'Chemistry';
    SELECT id INTO hist_id FROM subjects WHERE name = 'History & Government';
    SELECT id INTO geo_id FROM subjects WHERE name = 'Geography';
    SELECT id INTO cre_id FROM subjects WHERE name = 'CRE';
    SELECT id INTO kisw_id FROM subjects WHERE name = 'Kiswahili';
    SELECT id INTO eng_id FROM subjects WHERE name = 'English';
    SELECT id INTO bus_id FROM subjects WHERE name = 'Business Studies';
    SELECT id INTO agri_id FROM subjects WHERE name = 'Agriculture';

    -- 1. Topics for Chemistry
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (chem_id, 'Introduction to Chemistry', 'Form 1', 1),
        (chem_id, 'Simple Classification of Substances', 'Form 1', 2),
        (chem_id, 'Acids, Bases and Indicators', 'Form 1', 3),
        (chem_id, 'Air and Combustion', 'Form 1', 4),
        (chem_id, 'Water and Hydrogen', 'Form 1', 5),
        (chem_id, 'Structure of the Atom and Periodic Table', 'Form 2', 6),
        (chem_id, 'Chemical Families: Patterns in Properties', 'Form 2', 7),
        (chem_id, 'Structure and Bonding', 'Form 2', 8),
        (chem_id, 'Salts', 'Form 2', 9),
        (chem_id, 'The Mole: Formulae and Chemical Equations', 'Form 3', 10),
        (chem_id, 'Organic Chemistry I (Alkanes)', 'Form 3', 11),
        (chem_id, 'Nitrogen and its Compounds', 'Form 3', 12),
        (chem_id, 'Sulphur and its Compounds', 'Form 3', 13),
        (chem_id, 'Reaction Rates and Reversible Reactions', 'Form 4', 14),
        (chem_id, 'Electrochemistry', 'Form 4', 15),
        (chem_id, 'Metals (Extraction and Properties)', 'Form 4', 16),
        (chem_id, 'Organic Chemistry II (Alkanols/Alkanoic Acids)', 'Form 4', 17),
        (chem_id, 'Radioactivity', 'Form 4', 18);

    -- 2. Topics for English
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (eng_id, 'Parts of Speech & Sentence Structures', 'Form 1', 1),
        (eng_id, 'Oral Skills I (Pronunciation & Etiquette)', 'Form 1', 2),
        (eng_id, 'Reading Comprehension & Study Skills', 'Form 1', 3),
        (eng_id, 'Functional Writing I (Letters & Notices)', 'Form 2', 4),
        (eng_id, 'Poetry Analysis I', 'Form 2', 5),
        (eng_id, 'Phrases, Clauses and Sentences', 'Form 2', 6),
        (eng_id, 'Narrative and Descriptive Essays', 'Form 3', 7),
        (eng_id, 'Set Book Analysis I (Compulsory Novel)', 'Form 3', 8),
        (eng_id, 'Argumentative and Persuasive Writing', 'Form 4', 9),
        (eng_id, 'Oral Skills II (Debate & Interviews)', 'Form 4', 10),
        (eng_id, 'Set Book Analysis II (Drama & Anthology)', 'Form 4', 11),
        (eng_id, 'Advanced Grammar & Editing', 'Form 4', 12);

    -- 3. Topics for Kiswahili
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (kisw_id, 'Sarufi na Matumizi ya Lugha I', 'Form 1', 1),
        (kisw_id, 'Ufahamu na Ufupisho', 'Form 1', 2),
        (kisw_id, 'Fasihi Simulizi (Oral Literature)', 'Form 1', 3),
        (kisw_id, 'Insha za Maelezo na Barua', 'Form 2', 4),
        (kisw_id, 'Isimu Jamii (Sociolinguistics)', 'Form 2', 5),
        (kisw_id, 'Riwaya (Analysis of Novel)', 'Form 2', 6),
        (kisw_id, 'Tamthilia (Analysis of Play)', 'Form 3', 7),
        (kisw_id, 'Sarufi na Matumizi ya Lugha II', 'Form 3', 8),
        (kisw_id, 'Ushairi (Poetry)', 'Form 3', 9),
        (kisw_id, 'Hadithi Fupi (Short Stories)', 'Form 4', 10),
        (kisw_id, 'Insha za Kitaaluma na Mijadala', 'Form 4', 11),
        (kisw_id, 'Mbinu za Lugha na Usemi', 'Form 4', 12);

    -- 4. Topics for History & Government
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (hist_id, 'Introduction to History & Government', 'Form 1', 1),
        (hist_id, 'Early Man', 'Form 1', 2),
        (hist_id, 'Migration and Settlement of Kenyan Communities', 'Form 1', 3),
        (hist_id, 'Citizenship and National Integration', 'Form 1', 4),
        (hist_id, 'Trade and Urbanization', 'Form 2', 5),
        (hist_id, 'Development of Transport and Communication', 'Form 2', 6),
        (hist_id, 'Industrialization and Industry', 'Form 2', 7),
        (hist_id, 'Establishment of Colonial Rule in Kenya', 'Form 3', 8),
        (hist_id, 'Colonial Administration and Struggles', 'Form 3', 9),
        (hist_id, 'Rise of African Nationalism', 'Form 3', 10),
        (hist_id, 'The Constitution and Constitution Making', 'Form 4', 11),
        (hist_id, 'Government Revenue and Expenditure', 'Form 4', 12),
        (hist_id, 'International Relations and Co-operation', 'Form 4', 13),
        (hist_id, 'Devolution and County Governments', 'Form 4', 14);

    -- 5. Topics for Geography
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (geo_id, 'Introduction to Geography', 'Form 1', 1),
        (geo_id, 'The Earth and Solar System', 'Form 1', 2),
        (geo_id, 'Weather and Climate', 'Form 1', 3),
        (geo_id, 'Statistics and Field Work', 'Form 1', 4),
        (geo_id, 'Internal Land-forming Processes', 'Form 2', 5),
        (geo_id, 'Map Work (Interpretation and Analysis)', 'Form 2', 6),
        (geo_id, 'External Land-forming Processes (Rivers/Lakes)', 'Form 3', 7),
        (geo_id, 'Agriculture and Forestry', 'Form 3', 8),
        (geo_id, 'Mining and Energy Resources', 'Form 3', 9),
        (geo_id, 'Wildlife and Tourism', 'Form 4', 10),
        (geo_id, 'Industry and Urbanization', 'Form 4', 11),
        (geo_id, 'Environmental Management & Hazards', 'Form 4', 12),
        (geo_id, 'Settlement and Population', 'Form 4', 13);

    -- 6. Topics for CRE
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (cre_id, 'Introduction to CRE and the Bible', 'Form 1', 1),
        (cre_id, 'Creation and the Fall of Man', 'Form 1', 2),
        (cre_id, 'Faith and God''s Promises: Abraham', 'Form 1', 3),
        (cre_id, 'Leadership in Israel: David and Solomon', 'Form 2', 4),
        (cre_id, 'Selected Aspects of African Religious Heritage', 'Form 2', 5),
        (cre_id, 'The Infancy and Early Life of Jesus', 'Form 3', 6),
        (cre_id, 'The Ministry of Jesus (Galilean & Jerusalem)', 'Form 3', 7),
        (cre_id, 'The Holy Spirit and Gifts of the Spirit', 'Form 3', 8),
        (cre_id, 'Christian Approaches to Wealth and Money', 'Form 4', 9),
        (cre_id, 'Christian Approaches to Leisure and Social Issues', 'Form 4', 10),
        (cre_id, 'Christian Approaches to Law, Order and Justice', 'Form 4', 11),
        (cre_id, 'The Prophets: Amos, Jeremiah, Nehemiah', 'Form 4', 12);

    -- 7. Topics for Business Studies
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (bus_id, 'Introduction to Business Studies', 'Form 1', 1),
        (bus_id, 'Business and its Environment', 'Form 1', 2),
        (bus_id, 'Satisfaction of Human Wants', 'Form 1', 3),
        (bus_id, 'The Office', 'Form 1', 4),
        (bus_id, 'Home Trade and Entrepreneurship', 'Form 2', 5),
        (bus_id, 'Forms of Business Units', 'Form 2', 6),
        (bus_id, 'Transport and Communication', 'Form 2', 7),
        (bus_id, 'Warehousing and Insurance', 'Form 2', 8),
        (bus_id, 'Demand and Supply', 'Form 3', 9),
        (bus_id, 'Size and Location of a Firm', 'Form 3', 10),
        (bus_id, 'Product Markets and Distribution', 'Form 3', 11),
        (bus_id, 'National Income and Money', 'Form 4', 12),
        (bus_id, 'Public Finance and International Trade', 'Form 4', 13),
        (bus_id, 'Financial Statements (Ledger/Balance Sheet)', 'Form 4', 14);

    -- 8. Topics for Agriculture
    INSERT INTO topics (subject_id, title, form_level, sort_order) VALUES
        (agri_id, 'Introduction to Agriculture', 'Form 1', 1),
        (agri_id, 'Factors Influencing Agriculture', 'Form 1', 2),
        (agri_id, 'Farm Tools and Equipment', 'Form 1', 3),
        (agri_id, 'Soil Fertility I (Organic Manures)', 'Form 1', 4),
        (agri_id, 'Crop Production I (Land Preparation)', 'Form 1', 5),
        (agri_id, 'Livestock Production I (Breeds)', 'Form 2', 6),
        (agri_id, 'Soil Fertility II (Inorganic Fertilizers)', 'Form 2', 7),
        (agri_id, 'Crop Production II (Planting)', 'Form 2', 8),
        (agri_id, 'Livestock Production II (Nutrition)', 'Form 3', 9),
        (agri_id, 'Farm Structures', 'Form 3', 10),
        (agri_id, 'Crop Pests and Diseases', 'Form 4', 11),
        (agri_id, 'Livestock Health and Diseases', 'Form 4', 12),
        (agri_id, 'Farm Power and Machinery', 'Form 4', 13),
        (agri_id, 'Agricultural Economics (Marketing)', 'Form 4', 14);

END $$;
