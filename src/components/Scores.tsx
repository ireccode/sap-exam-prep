import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 75 },
  { name: 'Mar', score: 85 },
  { name: 'Apr', score: 80 },
  { name: 'May', score: 90 },
  { name: 'Jun', score: 95 },
];

function Scores() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">My Performance</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Exam Scores</h3>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold">{item.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score</span>
              <span className="font-semibold">81.67%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Highest Score</span>
              <span className="font-semibold">95%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Tests Taken</span>
              <span className="font-semibold">6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scores;