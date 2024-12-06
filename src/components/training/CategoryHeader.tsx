import React from 'react';
import { Shield } from 'lucide-react';
import { useProgressStore } from '@/store/useProgressStore';

interface CategoryHeaderProps {
  categories: { name: string; count: number }[];
}

export function CategoryHeader({ categories }: CategoryHeaderProps) {
  const { getWeakAreas, getStrengths } = useProgressStore();
  const weakAreas = getWeakAreas();
  const strengths = getStrengths();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-4">
        <Shield className="w-12 h-12 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold">Training Categories</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Strong Areas</h3>
          <ul className="text-sm">
            {strengths.map(area => (
              <li key={area} className="text-green-700">{area}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Areas to Improve</h3>
          <ul className="text-sm">
            {weakAreas.map(area => (
              <li key={area} className="text-red-700">{area}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Total Questions</h3>
          <p className="text-lg font-bold">
            {categories.reduce((sum, cat) => sum + cat.count, 0)} questions across {categories.length} categories
          </p>
        </div>
      </div>
    </div>
  );
}