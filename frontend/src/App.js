import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CourseSelection from './components/CourseSelection';

function App() {
  const [empId, setEmpId] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home setEmpId={setEmpId} />} />
        <Route path="/course-selection" element={<CourseSelection empId={empId} />} />
      </Routes>
    </Router>
  );
}

export default App;
