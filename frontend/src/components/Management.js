import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import './Management.css';

const Management = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [facultyData, setFacultyData] = useState([]);
  const [courseData, setCourseData] = useState({});
  const [file, setFile] = useState(null);
  const [uploadedCourses, setUploadedCourses] = useState([]);

  const correctUsername = process.env.REACT_APP_ADMIN_USER_ID;
  const correctPassword = process.env.REACT_APP_ADMIN_USER_PASSWORD;
  const [showPassword, setShowPassword] = useState(false);
  const [domainConfigs, setDomainConfigs] = useState([]);

  // Load courses.json from the public folder
  useEffect(() => {
    axios.get('courses.json')
      .then(response => {
        const coursesData = response.data || [];

        // Extract unique domain names
        const uniqueDomains = [...new Set(coursesData.map(course => course.domain))];

        // Initialize domainConfigs with default values
        const initialConfigs = uniqueDomains.map(domain => ({
          domain,
          minCount: 0,
          maxCount: 0
        }));

        setDomainConfigs(initialConfigs);
      })
      .catch(error => console.error("Error loading courses.json:", error));
  }, []);

  // Handle user input for min/max
  const handleInputChange = (index, field, value) => {
    const updatedConfigs = [...domainConfigs];
    updatedConfigs[index][field] = Number(value);
    setDomainConfigs(updatedConfigs);
  };

  // Save domain constraints to MongoDB
  const saveDomainConfig = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/domain-config/save`, { domainConfigs });
      alert("Domain constraints updated successfully!");
    } catch (error) {
      console.error("Error saving domain constraints:", error);
      alert("Failed to update constraints.");
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty`);
      console.log("Faculty Data:", response.data);
      setFacultyData(response.data);

      const courseMap = {};
      response.data.forEach(faculty => {
        faculty.selectedCourses.forEach((course, index) => {
          if (!courseMap[course.courseName]) {
            courseMap[course.courseName] = [];
          }
          courseMap[course.courseName].push({
            facultyName: faculty.name,
            choice: `Choice ${index + 1}`,
            facultyId: faculty.empId
          });
        });
      });
      setCourseData(courseMap);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  useEffect(() => {
    console.log("Management Page Mounted");
    fetchData();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // ✅ Convert Excel/CSV data to JSON format
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      // ✅ Store courses in a map to group same names
      const coursesMap = {};

      parsedData.forEach((row) => {
        const courseName = row["Course Name"];
        const courseId = row["Course ID"];
        const type = row["Course Type"]; // "Theory" or "Theory+Lab"
        const domain = row["Domain"];

        if (!coursesMap[courseName]) {
          coursesMap[courseName] = {
            courseName,
            type,
            domain,
            courseIds: new Set(),
          };
        }

        // ✅ Avoid duplicate course IDs
        coursesMap[courseName].courseIds.add(courseId);
      });

      // ✅ Convert map to array & store in localStorage
      const formattedCourses = Object.values(coursesMap).map(course => ({
        ...course,
        courseIds: Array.from(course.courseIds).join(" ; "), // Format Course IDs
      }));

      localStorage.setItem("uploadedCourses", JSON.stringify(formattedCourses));
      setUploadedCourses(formattedCourses);

      alert("Courses uploaded successfully!");
    };

    reader.readAsArrayBuffer(file);
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
      <h1>Management Portal - {process.env.REACT_APP_BACKEND_URL}</h1>
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
        <div>
      <h1>Domain Constraints</h1>
      {domainConfigs.map((config, index) => (
        <div key={index}>
          <h3>{config.domain}</h3>
          <label>Min:</label>
          <input 
            type="number" 
            value={config.minCount}
            onChange={(e) => handleInputChange(index, 'minCount', e.target.value)}
          />
          <label>Max:</label>
          <input 
            type="number" 
            value={config.maxCount}
            onChange={(e) => handleInputChange(index, 'maxCount', e.target.value)}
          />
        </div>
      ))}
      <button onClick={saveDomainConfig}>Save Settings</button>
    </div>
        
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
                <th>UG</th>
                <th>UG Specialization</th>
                <th>PG</th>
                <th>PG Specialization</th>
                <th>Research Domain</th>
              </tr>
            </thead>
            <tbody>
              {facultyData.map(faculty => (
                <tr key={faculty.empId}>
                  <td>{faculty.name}</td>
                  <td>{faculty.empId}</td>
                  <td>{faculty.preference}</td>
                  <td>{faculty.selectedCourses.map(course => course.courseName).join(", ")}</td>
                  <td>{faculty.ug || "N/A"}</td>
                  <td>{faculty.ugspecialization || "N/A"}</td>
                  <td>{faculty.pg || "N/A"}</td>
                  <td>{faculty.pgspecialization || "N/A"}</td>
                  <td>{faculty.researchdomain || "N/A"}</td>
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
