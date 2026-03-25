-- Insert the 8 automotive engineering subjects
INSERT INTO subjects (id, name, icon) VALUES
  ('engineering-math', 'Engineering Math', '🧮'),
  ('auto-eng-science', 'Auto Eng Science', '⚙️'),
  ('vehicle-fuel-system', 'Vehicle Fuel System', '⛽'),
  ('vehicle-electrical-systems', 'Vehicle Electrical Systems', '⚡'),
  ('vehicle-basic-maintenance', 'Vehicle Basic Maintenance', '🔧'),
  ('technical-drawing', 'Technical Drawing', '📐'),
  ('workshop-technology', 'Workshop Technology', '🛠️'),
  ('work-ethics-practices', 'Work Ethics & Practices', '🤝');

-- Insert topics
-- Engineering Math
INSERT INTO topics (subject_id, name) VALUES
  ('engineering-math', 'Differentiation'),
  ('engineering-math', 'Calculus'),
  ('engineering-math', 'Series & Sequences'),
  ('engineering-math', 'Vectors & Vector Calculus'),
  ('engineering-math', 'Matrices & Eigenvalues'),
  ('engineering-math', 'Binomial Expansion'),
  ('engineering-math', 'Algebra'),
  ('engineering-math', 'Simultaneous Equations'),
  ('engineering-math', 'Indices'),
  ('engineering-math', 'Quadratic Equations'),
  ('engineering-math', 'Logarithms'),
  ('engineering-math', 'Trigonometry & Hyperbolic Functions'),
  ('engineering-math', 'Complex Numbers');

-- Auto Eng Science
INSERT INTO topics (subject_id, name) VALUES
  ('auto-eng-science', 'Angular Motion'),
  ('auto-eng-science', 'Temperature & Heat'),
  ('auto-eng-science', 'Simply Supported Beams'),
  ('auto-eng-science', 'Simple Machines'),
  ('auto-eng-science', 'Friction');

-- Vehicle Fuel System
INSERT INTO topics (subject_id, name) VALUES
  ('vehicle-fuel-system', 'Spark Ignition'),
  ('vehicle-fuel-system', 'Electronic Fuel Injection'),
  ('vehicle-fuel-system', 'Carburettor'),
  ('vehicle-fuel-system', 'Fuel Injection CI & SI'),
  ('vehicle-fuel-system', 'CI Engine Governors'),
  ('vehicle-fuel-system', 'Pumps');

-- Vehicle Electrical Systems
INSERT INTO topics (subject_id, name) VALUES
  ('vehicle-electrical-systems', 'Ignition System'),
  ('vehicle-electrical-systems', 'Charging System'),
  ('vehicle-electrical-systems', 'Starting System'),
  ('vehicle-electrical-systems', 'Lighting System'),
  ('vehicle-electrical-systems', 'Auxiliary System'),
  ('vehicle-electrical-systems', 'Battery Servicing');

-- Vehicle Basic Maintenance
INSERT INTO topics (subject_id, name) VALUES
  ('vehicle-basic-maintenance', 'OBD II Scanner'),
  ('vehicle-basic-maintenance', 'Wheels & Tyres'),
  ('vehicle-basic-maintenance', 'HVAC'),
  ('vehicle-basic-maintenance', 'Overhaul');

-- Technical Drawing
INSERT INTO topics (subject_id, name) VALUES
  ('technical-drawing', 'Geometric Drawing'),
  ('technical-drawing', 'Construction of Figures'),
  ('technical-drawing', 'Isometric & Oblique Projection'),
  ('technical-drawing', 'Construction of Circles'),
  ('technical-drawing', 'Tangency'),
  ('technical-drawing', 'Conic Sections & Developments');

-- Workshop Technology
INSERT INTO topics (subject_id, name) VALUES
  ('workshop-technology', 'Metals Tools & Equipment'),
  ('workshop-technology', 'Properties of Metals'),
  ('workshop-technology', 'Drilling'),
  ('workshop-technology', 'Welding'),
  ('workshop-technology', 'Milling'),
  ('workshop-technology', 'Lathe Machine');

-- Work Ethics & Practices
INSERT INTO topics (subject_id, name) VALUES
  ('work-ethics-practices', 'Self-Management'),
  ('work-ethics-practices', 'Interpersonal Communication'),
  ('work-ethics-practices', 'Safe Work Habits'),
  ('work-ethics-practices', 'Lead a Team'),
  ('work-ethics-practices', 'Plan & Organise Work'),
  ('work-ethics-practices', 'Professional Growth'),
  ('work-ethics-practices', 'Workplace Learning'),
  ('work-ethics-practices', 'Problem Solving');
