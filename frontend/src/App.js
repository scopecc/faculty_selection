import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CourseSelection from './components/CourseSelection';
import Management from './components/Management';
import FacultyDetails from "./components/FacultyDetails";

const App = () => {
  const [empId, setEmpId] = useState(null);
  const [facultyName, setFacultyName] = useState('');
  const [preference, setPreference] = useState('');

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home setEmpId={setEmpId} setFacultyName={setFacultyName} setPreference={setPreference} />} />
        <Route path="/course-selection" element={<CourseSelection empId={empId} facultyName={facultyName} preference={preference} />} />
        <Route path="/management" element={<Management />} />
        <Route path="/faculty/:empId" element={<FacultyDetails />} />
      </Routes>
    </Router>
  );
};

export default App;
