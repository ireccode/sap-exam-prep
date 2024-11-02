import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Training from './components/Training';
import Exam from './components/Exam';
import Glossary from './components/Glossary';
import Scores from './components/Scores';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<Training />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/scores" element={<Scores />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;