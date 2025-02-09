import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import './Management.css'; // Import the CSS file



const Management = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [facultyData, setFacultyData] = useState([]);
  const [courseData, setCourseData] = useState({});

  const correctUsername = "admin";
  const correctPassword = "admin123";

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === correctUsername && password === correctPassword) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Incorrect username or password.");
    }
  };

  // Fetch faculty data and organize it by course
  const fetchData = async () => {
    try {
      const response = await axios.get('http://faculty-selection.onrender.com/');
      setFacultyData(response.data);

      const courseMap = {};
      response.data.forEach(faculty => {
        faculty.selectedCourses.forEach((course, index) => {
          if (!courseMap[course.courseName]) {
            courseMap[course.courseName] = [];
          }
          // Add facultyId along with name and choice
          courseMap[course.courseName].push({
            facultyName: faculty.name,
            choice: `Choice ${index + 1}`,
            facultyId: faculty.empId // Include the faculty ID here
          });
        });
      });
      setCourseData(courseMap);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  // Download faculty course selection as Excel
  const handleDownloadFacultyExcel = () => {
    const facultyExcelData = [];

    facultyData.forEach(faculty => {
      faculty.selectedCourses.forEach((course, index) => {
        facultyExcelData.push({
          "Faculty Name": faculty.name,
          "Empld": faculty.empId,
          "Course Name": course.courseName,
          "Choice": `Choice ${index + 1}`
        });
      });
      facultyExcelData.push({});
    });

    const ws = XLSX.utils.json_to_sheet(facultyExcelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Selection");
    XLSX.writeFile(wb, "faculty_course_selection.xlsx");
  };

  // Download course selection as Excel
  const handleDownloadCourseExcel = () => {
    const courseExcelData = [];

    Object.entries(courseData).forEach(([courseName, facultyList]) => {
      facultyList.forEach(({ facultyName, choice, facultyId }) => {
        courseExcelData.push({
          "Course Name": courseName,
          "EmpId": facultyId,  // facultyId should now have values
          "Faculty Name": facultyName,
          "Choice": choice
        });
      });
      courseExcelData.push({})
    });

    const ws = XLSX.utils.json_to_sheet(courseExcelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Selection");
    XLSX.writeFile(wb, "course_selection.xlsx");
  };

  return (
    <div>
      <h1>Management Portal</h1>

      {/* Login Form */}
      {!isAuthenticated ? (
        <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
          <div className="password-container">
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button
            type="button"
            className="eye-button"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
          <button type="submit">Login</button>
        </form>
        </div>
      ) : (
        <>
          {/* Faculty Course Selection Table */}
          <div className="table-container">
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
          

          {/* Button to download Faculty Excel */}
          <button onClick={handleDownloadFacultyExcel}>Download Faculty Excel</button>
          </div>

          <div className="table-container">

          {/* Courses Selected by Faculty Table */}
          <h2>Courses Selected by Faculty</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Selected by Faculty</th>
                <th>Choice</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(courseData).map(([courseName, facultyList]) => (
                <tr key={courseName}>
                  <td>{courseName}</td>
                  <td>{facultyList.map(item => item.facultyName).join(", ")}</td>
                  <td>{facultyList.map(item => item.choice).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Button to download Course Excel */}
          <button onClick={handleDownloadCourseExcel}>Download Course Excel</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Management;
