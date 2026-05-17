import { PortalType } from "../../types/canonical";

/**
 * KNOWLEDGE TAXONOMY REGISTRY
 * 
 * Authoritative registry for all curriculum hierarchies.
 * Controls ingestion, grounding, and recommendations.
 */

interface HighSchoolSubject {
  id: string;
  title: string;
  domains: readonly string[];
}

interface UniversityCourse {
  id: string;
  title: string;
}

interface UniversityProgram {
  id: string;
  title: string;
  courses: readonly UniversityCourse[];
}

interface UniversityDepartment {
  id: string;
  title: string;
  programs: readonly UniversityProgram[];
}

interface UniversitySchool {
  id: string;
  title: string;
  departments: readonly UniversityDepartment[];
}

interface KnowledgeDomain {
  id: string;
  title: string;
}

interface TaxonomyRegistry {
  high_school: {
    curriculum: 'KICD_KCSE';
    subjects: readonly HighSchoolSubject[];
  };
  university: {
    schools: readonly UniversitySchool[];
  };
  knowledge_explorer: {
    domains: readonly KnowledgeDomain[];
  };
}

export const TAXONOMIES: TaxonomyRegistry = {
  high_school: {
    curriculum: 'KICD_KCSE',
    subjects: [
      { id: 'HS-MATH', title: 'Mathematics', domains: ['Algebra', 'Geometry', 'Calculus'] },
      { id: 'HS-PHYS', title: 'Physics', domains: ['Mechanics', 'Electricity', 'Waves'] },
      { id: 'HS-BIO', title: 'Biology', domains: ['Cells', 'Genetics', 'Ecology'] },
      { id: 'HS-CHEM', title: 'Chemistry', domains: ['Atomic Structure', 'Organic Chemistry', 'Chemical Energetics'] },
      { id: 'HS-ENG', title: 'English', domains: ['Grammar', 'Literature', 'Composition'] }
    ]
  },
  
  university: {
    schools: [
      {
        id: 'UNI-COMP',
        title: 'School of Computing',
        departments: [
          {
            id: 'UNI-COMP-CS',
            title: 'Computer Science',
            programs: [
              {
                id: 'UNI-COMP-CS-BSC',
                title: 'BSc Computer Science',
                courses: [
                  { id: 'UNI-COMP-CS-BSC-DSA', title: 'Data Structures' },
                  { id: 'UNI-COMP-CS-BSC-ALG', title: 'Algorithms' },
                  { id: 'UNI-COMP-CS-BSC-OS', title: 'Operating Systems' }
                ]
              }
            ]
          },
          {
            id: 'UNI-COMP-SE',
            title: 'Software Engineering',
            programs: [
              {
                id: 'UNI-COMP-SE-BSC',
                title: 'BSc Software Engineering',
                courses: [
                  { id: 'UNI-COMP-SE-BSC-REQ', title: 'Requirements Engineering' },
                  { id: 'UNI-COMP-SE-BSC-ARCH', title: 'Software Architecture' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-ENG',
        title: 'School of Engineering',
        departments: [
          {
            id: 'UNI-ENG-ELEC',
            title: 'Electrical Engineering',
            programs: [
              {
                id: 'UNI-ENG-ELEC-BSC',
                title: 'BSc Electrical Engineering',
                courses: [
                  { id: 'UNI-ENG-ELEC-BSC-CIR', title: 'Circuit Theory' },
                  { id: 'UNI-ENG-ELEC-BSC-POW', title: 'Power Systems' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-MED',
        title: 'School of Medicine',
        departments: [
          {
            id: 'UNI-MED-CLIN',
            title: 'Clinical Medicine',
            programs: [
              {
                id: 'UNI-MED-CLIN-MBCHB',
                title: 'Bachelor of Medicine and Bachelor of Surgery',
                courses: [
                  { id: 'UNI-MED-CLIN-MBCHB-ANAT', title: 'Human Anatomy' },
                  { id: 'UNI-MED-CLIN-MBCHB-PHYS', title: 'Physiology' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-BUS',
        title: 'School of Business',
        departments: [
          {
            id: 'UNI-BUS-MGMT',
            title: 'Management Science',
            programs: [
              {
                id: 'UNI-BUS-MGMT-BCOM',
                title: 'Bachelor of Commerce',
                courses: [
                  { id: 'UNI-BUS-MGMT-ACC', title: 'Financial Accounting' },
                  { id: 'UNI-BUS-MGMT-MKT', title: 'Marketing Management' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-LAW',
        title: 'School of Law',
        departments: [
          {
            id: 'UNI-LAW-PUB',
            title: 'Public Law',
            programs: [
              {
                id: 'UNI-LAW-PUB-LLB',
                title: 'Bachelor of Laws',
                courses: [
                  { id: 'UNI-LAW-PUB-CONST', title: 'Constitutional Law' },
                  { id: 'UNI-LAW-PUB-CRIM', title: 'Criminal Law' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-EDU',
        title: 'School of Education',
        departments: [
          {
            id: 'UNI-EDU-CURR',
            title: 'Curriculum and Instruction',
            programs: [
              {
                id: 'UNI-EDU-CURR-BED',
                title: 'Bachelor of Education',
                courses: [
                  { id: 'UNI-EDU-CURR-PED', title: 'Pedagogy' },
                  { id: 'UNI-EDU-CURR-ASSESS', title: 'Educational Assessment' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-AH',
        title: 'School of Arts & Humanities',
        departments: [
          {
            id: 'UNI-AH-LIT',
            title: 'Literature',
            programs: [
              {
                id: 'UNI-AH-LIT-BA',
                title: 'BA Literature',
                courses: [
                  { id: 'UNI-AH-LIT-BA-AFR', title: 'African Literature' },
                  { id: 'UNI-AH-LIT-BA-CRIT', title: 'Literary Criticism' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'UNI-SCI',
        title: 'School of Natural Sciences',
        departments: [
          {
            id: 'UNI-SCI-MATH',
            title: 'Mathematics',
            programs: [
              {
                id: 'UNI-SCI-MATH-BSC',
                title: 'BSc Mathematics',
                courses: [
                  { id: 'UNI-SCI-MATH-BSC-CALC', title: 'Calculus' },
                  { id: 'UNI-SCI-MATH-BSC-LINALG', title: 'Linear Algebra' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  
  knowledge_explorer: {
    domains: [
      { id: 'KE-TECH', title: 'Technology' },
      { id: 'KE-BUSINESS', title: 'Business' },
      { id: 'KE-CREATIVE', title: 'Creative Arts' }
    ]
  }
};

/**
 * Validates if a canonical ID matches the authoritative taxonomy.
 */
export const validateCanonicalID = (id: string, portal: PortalType): boolean => {
  const prefix = id.split('-')[0];
  switch (portal) {
    case 'high_school': return prefix === 'HS';
    case 'university': return prefix === 'UNI';
    case 'knowledge_explorer': return prefix === 'KE';
    default: return false;
  }
};
