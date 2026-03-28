import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CourseSelection from './components/CourseSelection';
import Management from './components/Management';
import FacultyDetails from "./components/FacultyDetails";
import './App.css';

const AppContent = ({ empId, setEmpId, facultyName, setFacultyName, preference, setPreference, isAdminAuthenticated, setIsAdminAuthenticated }) => {
  const location = useLocation();
  const hideNavbar = isAdminAuthenticated || location.pathname === '/course-selection';

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar />}
      <main className={`main-content ${!hideNavbar ? 'with-navbar' : ''}`}>
        <Routes>
          <Route path="/" element={<Home setEmpId={setEmpId} setFacultyName={setFacultyName} setPreference={setPreference} />} />
          <Route path="/course-selection" element={<CourseSelection empId={empId} facultyName={facultyName} preference={preference} />} />
          <Route path="/management" element={<Management onAuthChange={setIsAdminAuthenticated} />} />
          <Route path="/faculty/:empId" element={<FacultyDetails />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  const [empId, setEmpId] = useState(null);
  const [facultyName, setFacultyName] = useState('');
  const [preference, setPreference] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  return (
    <Router>
      <AppContent 
        empId={empId} setEmpId={setEmpId}
        facultyName={facultyName} setFacultyName={setFacultyName}
        preference={preference} setPreference={setPreference}
        isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated}
      />
    </Router>
  );
};

export default App;
