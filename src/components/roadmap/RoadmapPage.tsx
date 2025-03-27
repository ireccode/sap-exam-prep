import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ExamInfo {
  id: string;
  title: string;
  code: string;
  status: 'current' | 'future';
  description: string;
  isPremium: boolean;
}

const exams: ExamInfo[] = [
  {
    id: 'btp',
    title: 'SAP Certified Professional - Solution Architect - SAP BTP',
    code: 'P_BTPA_2408',
    status: 'current',
    description: 'SAP BTP - Build cloud-native applications and integrate SAP solutions.',
    isPremium: false
  },
  {
    id: 'cx',
    title: 'SAP Certified Associate - Solution Architect - SAP Customer Experience',
    code: 'C_C4HCX_24',
    status: 'future',
    description: 'SAP Customer Experience - Master customer engagement and commerce solutions.',
    isPremium: true
  },
  {
    id: 'ea',
    title: 'SAP Certified Professional - SAP Enterprise Architect',
    code: 'P_SAPEA_2023',
    status: 'future',
    description: 'Enterprise-wide architecture and digital transformation strategies.',
    isPremium: true
  }
];

export function RoadmapPage() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();

  const handleExamClick = (exam: ExamInfo) => {
    if (exam.status === 'current') {
      // Determine the price ID based on the exam code
      const priceId = import.meta.env[`VITE_STRIPE_PRICE_ID_${exam.code}`] || import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;

      // Log the current price ID to the console
      console.log(`Current Price ID for ${exam.code}:`, priceId);

      // Set the VITE_STRIPE_PREMIUM_PRICE_ID environment variable
      import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID = priceId;

      // Redirect to /training
      navigate('/training', { state: { productTitle: exam.title } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Your Certification Journey
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Follow your path to becoming a certified SAP architect
          </p>
        </div>

        <div className="space-y-8">
          {exams.map((exam, index) => (
            <div
              key={exam.id}
              className={cn(
                "relative bg-white rounded-lg shadow-md p-6 transition-all duration-300",
                exam.status === 'current' ? 'border-2 border-blue-500' : 'border border-gray-200',
                exam.status === 'current' && 'hover:shadow-lg cursor-pointer'
              )}
              onClick={() => handleExamClick(exam)}
            >
              {/* Status indicator */}
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                {exam.status === 'current' ? (
                  <div className="bg-blue-500 rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-200 rounded-full p-1">
                    <Circle className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Connector line */}
              {index < exams.length - 1 && (
                <div className="absolute -left-1 top-1/2 h-24 w-0.5 bg-gray-200" />
              )}

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    Exam Code: {exam.code}
                  </p>
                  <p className="text-gray-600 mt-2">{exam.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {exam.isPremium && (
                    <div className={cn(
                      "flex items-center",
                      isPremium ? "text-yellow-600" : "text-gray-400"
                    )}>
                      {isPremium ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>
                  )}
                  {exam.status === 'current' && (
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute top-4 right-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  exam.status === 'current' 
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                )}>
                  {exam.status === 'current' ? 'Current' : 'Coming Soon'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            More certifications will be available very soon.
          </p>
        </div>
      </div>
    </div>
  );
} 