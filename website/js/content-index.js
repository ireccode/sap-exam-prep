// Content Index & Topic Clustering for SAPArchitectPrep.com
// This module clusters all content by pillar topic and subtopic for SEO and AI search

export const CONTENT_INDEX = [
  {
    id: 'pillar-exam-prep',
    pillar: 'Exam Preparation',
    description: 'All resources for SAP certification exam preparation, including study plans and mock exams.',
    clusters: [
      {
        id: 'cluster-mock-exams',
        name: 'Mock Exams',
        items: [
          {
            type: 'exam',
            title: 'SAP Certified Professional - Solution Architect - SAP BTP (P_BTPA_2408)',
            url: '#',
            tags: ['P_BTPA_2408', 'mock', 'practice', 'exam']
          },
          {
            type: 'exam',
            title: 'SAP Certified Associate - Solution Architect - SAP Customer Experience (C_C4HCX_24)',
            url: '#',
            tags: ['C_C4HCX_24', 'mock', 'practice', 'exam']
          },
          {
            type: 'exam',
            title: 'SAP Certified Professional - SAP Enterprise Architect (P_SAPEA_2023)',
            url: '#',
            tags: ['P_SAPEA_2023', 'mock', 'practice', 'exam']
          }
        ]
      },
      {
        id: 'cluster-study-plans',
        name: 'Study Plans',
        items: [
          {
            type: 'guide',
            title: 'SAP Exam Study Plan: P_BTPA_2408',
            url: '#',
            tags: ['study plan', 'P_BTPA_2408', 'guide', 'prep']
          }
        ]
      }
    ]
  },
  {
    id: 'pillar-guides',
    pillar: 'Guides & Articles',
    description: 'In-depth guides, articles, and tips for SAP certification success.',
    clusters: [
      {
        id: 'cluster-tips',
        name: 'Certification Tips',
        items: [
          {
            type: 'article',
            title: 'Top SAP Certification Tips',
            url: '#',
            tags: ['tips', 'certification', 'article']
          }
        ]
      }
    ]
  },
  {
    id: 'pillar-faq',
    pillar: 'FAQs',
    description: 'Frequently asked questions about SAP certification and the platform.',
    clusters: [
      {
        id: 'cluster-general-faq',
        name: 'General FAQ',
        items: [
          {
            type: 'faq',
            title: 'How do I register for SAP certification?',
            url: '#',
            tags: ['faq', 'register', 'certification', 'SAP']
          },
          {
            type: 'faq',
            title: 'How accurate are the mock exams?',
            url: '#',
            tags: ['faq', 'mock', 'exam', 'accuracy']
          }
        ]
      }
    ]
  },
  {
    id: 'pillar-analytics',
    pillar: 'Analytics & Progress',
    description: 'Analytics, adaptive feedback, and progress tracking for SAP certification.',
    clusters: [
      {
        id: 'cluster-adaptive',
        name: 'Adaptive Analytics',
        items: [
          {
            type: 'feature',
            title: 'Personalized Adaptive Analytics',
            url: '#',
            tags: ['analytics', 'adaptive', 'progress', 'tracking']
          }
        ]
      }
    ]
  }
];
