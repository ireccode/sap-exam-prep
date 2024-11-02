import React, { useState } from 'react';
import { Search, Cloud } from 'lucide-react';

const glossaryItems = [
  { term: 'ABAP', definition: 'Advanced Business Application Programming - SAP\'s proprietary programming language' },
  { term: 'BAPIs', definition: 'Business Application Programming Interfaces - standardized interfaces to SAP business objects' },
  { term: 'ECC', definition: 'ERP Central Component - the core component of SAP R/3' },
  // Add more terms as needed
];

function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = glossaryItems.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-blue-600 text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Cloud size={24} />
            <h2 className="text-2xl font-bold">SAP Glossary</h2>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search Glossary"
            className="w-full px-4 py-2 rounded-lg pl-10 text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">{item.term}</h3>
            <p className="text-gray-700">{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Glossary;