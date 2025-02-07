import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Management = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [facultyData, setFacultyData] = useState([]);
  const [courseData, setCourseData] = useState({});

  const correctUsername = "admin";  // ✅ Preset credentials
  const correctPassword = "admin123";

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === correctUsername && password === correctPassword) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Incorrect username or password.");
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/faculty');
      setFacultyData(response.data);

      // ✅ Build course-wise faculty data
      const courseMap = {};
      response.data.forEach(faculty => {
        faculty.selectedCourses.forEach(course => {
          if (!courseMap[course.courseName]) {
            courseMap[course.courseName] = [];
          }
          courseMap[course.courseName].push(faculty.name);
        });
      });
      setCourseData(courseMap);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  return (
    <div>
      <h1>Management Portal</h1>

      {/* ✅ Login Form */}
      {!isAuthenticated ? (
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <>
          {/* ✅ Faculty-wise course selection */}
          <h2>Faculty Course Selection</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th>Employee ID</th>
                <th>Preference</th>
                <th>Selected Courses</th>
              </tr>
            </thead>
            <tbody>
              {facultyData.map(faculty => (
                <tr key={faculty.empId}>
                  <td>{faculty.name}</td>
                  <td>{faculty.empId}</td>
                  <td>{faculty.preference}</td>
                  <td>{faculty.selectedCourses.map(course => course.courseName).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Course-wise faculty selection */}
          <h2>Courses Selected by Faculty</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Selected by Faculty</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(courseData).map(([courseName, facultyList]) => (
                <tr key={courseName}>
                  <td>{courseName}</td>
                  <td>{facultyList.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Management;
