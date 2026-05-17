/**
 * CANONICAL CURRICULUM REGISTRY
 * 
 * The authoritative spine for High School, University, and Knowledge Explorer hierarchies.
 */

export const CANONICAL_CURRICULUM = {
  HIGH_SCHOOL: {
    subjects: [
      {
        id: 'HS-MATH',
        title: 'Mathematics',
        topics: [
          {
            id: 'HS-MATH-ALG',
            title: 'Algebra',
            subtopics: ['Linear Equations', 'Quadratic Expressions', 'Polynomials']
          },
          {
            id: 'HS-MATH-CALC',
            title: 'Calculus',
            subtopics: ['Limits', 'Differentiation', 'Integration']
          }
        ]
      }
    ]
  },
  
  UNIVERSITY: {
    schools: [
      {
        id: 'UNI-SCHOOL-COMP',
        title: 'School of Computing',
        departments: [
          {
            id: 'UNI-DEPT-AI',
            title: 'Artificial Intelligence',
            programs: [
              {
                id: 'UNI-PROG-CS',
                title: 'Computer Science',
                courses: [
                  { id: 'UNI-COURSE-DSA', title: 'Data Structures & Algorithms' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  KNOWLEDGE_EXPLORER: {
    domains: [
      {
        id: 'KE-DOMAIN-AI',
        title: 'Artificial Intelligence',
        paths: [
          { id: 'KE-PATH-ML', title: 'Machine Learning Masterclass' }
        ]
      }
    ]
  }
};
