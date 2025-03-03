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
  const [uploadedCourses, setUploadedCourses] = useState([]);
  const [showFacultyTable, setShowFacultyTable] = useState(true);
  const [showCourseTable, setShowCourseTable] = useState(true);
  const correctUsername = process.env.REACT_APP_ADMIN_USER_ID;
  const correctPassword = process.env.REACT_APP_ADMIN_USER_PASSWORD;
  const [showPassword, setShowPassword] = useState(false);
  const [domainConfigs, setDomainConfigs] = useState([]);
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);


  // Load courses.json from the public folder
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/domain-config/domains`)
      .then(response => {
        const domainConfigs = response.data || [];
        const formattedConfigs = domainConfigs.map(domain => ({
          domain, // Keep domain name
          minCount: 0, // Default value
          maxCount: 5  // Default value
        }));
        // ✅ Ensure domains are extracted correctly
        console.log("📌 Domains from MongoDB:", domainConfigs);
        console.log("📌 Fetched Domain Configs:", formattedConfigs);
        setDomainConfigs(formattedConfigs);
      })
      .catch(error => console.error("❌ Error fetching domain configs from MongoDB:", error));
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
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // ✅ Convert Excel data to JSON format
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      
      // ✅ Store courses in a map to avoid duplicates
      const coursesMap = {};

      parsedData.forEach((row) => {
        const courseId = row["Course ID"];
        const courseName = row["Course Name"];
        const courseType = row["Course Type"]?.trim();
        const domain = row["Domain"];

        if (!courseId || !courseName || !courseType) return;

        if (!coursesMap[courseId]) {
          coursesMap[courseId] = {
            courseId,
            courseName,
            courseType,
            domain,
          };
        }
      });

      

      // ✅ Convert map to array & store in localStorage
      const formattedCourses = Object.values(coursesMap);
      console.log("📌 Debug: Formatted Courses:", formattedCourses);
      localStorage.setItem("uploadedCourses", JSON.stringify(formattedCourses));
      setUploadedCourses(formattedCourses);

      try {
        // ✅ Send courses data to backend API
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/courses/upload-courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedCourses),
        });

        if (!response.ok) throw new Error("Failed to upload courses");

        alert("✅ Courses uploaded to MongoDB successfully!");
      } catch (error) {
        console.error("❌ Error uploading courses:", error);
        alert("Error uploading courses. Try again.");
      }

      // ✅ Download courses.json automatically
      const jsonString = JSON.stringify(formattedCourses, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      
      document.body.appendChild(link);
      document.body.removeChild(link);
      
      
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
          "Choice": `Choice ${index + 1}`,
          "UG": faculty.ug,
          "UG SPL": faculty.ugspecialization,
          "PG": faculty.pg,
          "PG SPL": faculty.pgspecialization,
          "RESEARCH DOMAIN": faculty.researchdomain
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

    <div>
      <h1>Upload Course Data (Excel to JSON)</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button onClick={handleUpload}>Generate Courses JSON</button>

      {/* Display Processed Courses */}
      
      {courses.length > 0 && (
        <div>
          <h2>Extracted Course Data:</h2>
          <pre>{JSON.stringify(courses, null, 2)}</pre>
        </div>
      )}
    </div>
        
          {/* Faculty Course Selection Table */}
          <>
          <button onClick={() => setShowFacultyTable(!showFacultyTable)}>
          {showFacultyTable ? "Hide Faculty Table" : "Show Faculty Table"}
        </button>
          <button onClick={handleDownloadFacultyExcel}>Download Faculty Excel</button>
          

          {showFacultyTable && (
            <>
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
          </div>
          </>
          )}
        </>
        <br></br>
        <button onClick={() => setShowCourseTable(!showCourseTable)}>
          {showCourseTable ? "Hide Course Table" : "Show Course Table"}
        </button>
        <button onClick={handleDownloadCourseExcel}>Download Course Excel</button>
        {showCourseTable && (
            <>
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
          </div>

          </>
          )}
        </>
        
        )}
    </div>
  );
};

export default Management;
