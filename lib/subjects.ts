export interface Subject {
  id: string;
  name: string;
  icon: string;
  topics: string[];
}

export const SUBJECTS: Subject[] = [
  {
    id: 'engineering-math',
    name: 'Engineering Math',
    icon: '🧮',
    topics: [
      'Differentiation', 'Calculus', 'Series & Sequences', 
      'Vectors & Vector Calculus', 'Matrices & Eigenvalues', 'Binomial Expansion', 
      'Algebra', 'Simultaneous Equations', 'Indices', 'Quadratic Equations', 
      'Logarithms', 'Trigonometry & Hyperbolic Functions', 'Complex Numbers'
    ]
  },
  {
    id: 'auto-eng-science',
    name: 'Auto Eng Science',
    icon: '⚙️',
    topics: [
      'Angular Motion', 'Temperature & Heat', 'Simply Supported Beams', 
      'Simple Machines', 'Friction'
    ]
  },
  {
    id: 'vehicle-fuel-system',
    name: 'Vehicle Fuel System',
    icon: '⛽',
    topics: [
      'Spark Ignition', 'Electronic Fuel Injection', 
      'Carburettor', 'Fuel Injection CI & SI', 'CI Engine Governors', 'Pumps'
    ]
  },
  {
    id: 'vehicle-electrical-systems',
    name: 'Vehicle Electrical Systems',
    icon: '⚡',
    topics: [
      'Ignition System', 'Charging System', 
      'Starting System', 'Lighting System', 'Auxiliary System', 'Battery Servicing'
    ]
  },
  {
    id: 'vehicle-basic-maintenance',
    name: 'Vehicle Basic Maintenance',
    icon: '🔧',
    topics: [
      'OBD II Scanner', 'Wheels & Tyres', 'HVAC', 'Overhaul'
    ]
  },
  {
    id: 'technical-drawing',
    name: 'Technical Drawing',
    icon: '📐',
    topics: [
      'Geometric Drawing', 'Construction of Figures', 
      'Isometric & Oblique Projection', 'Construction of Circles', 'Tangency', 
      'Conic Sections & Developments'
    ]
  },
  {
    id: 'workshop-technology',
    name: 'Workshop Technology',
    icon: '🛠️',
    topics: [
      'Metals Tools & Equipment', 'Properties of Metals', 
      'Drilling', 'Welding', 'Milling', 'Lathe Machine'
    ]
  },
  {
    id: 'work-ethics-practices',
    name: 'Work Ethics & Practices',
    icon: '🤝',
    topics: [
      'Self-Management', 'Interpersonal Communication', 
      'Safe Work Habits', 'Lead a Team', 'Plan & Organise Work', 'Professional Growth', 
      'Workplace Learning', 'Problem Solving'
    ]
  }
];
