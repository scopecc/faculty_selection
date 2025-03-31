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
  // New states for forgot password and reset password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState("Loading");

  const [missingFacultyData, setMissingFacultyData] = useState([]);
  const [showMissingFacultyTable, setShowMissingFacultyTable] = useState(false);
  const [totalFacultiesCount, setTotalFacultiesCount] = useState(0);


  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/registration-status`)
      .then(response => {
        setRegistrationStatus(response.data.status);
      })
      .catch(error => console.error("Error fetching registration status:", error));
  }, []);

  const toggleRegistration = async () => {
    const newStatus = registrationStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/registration-status`, { status: newStatus });
      setRegistrationStatus(newStatus);
      alert(`Registration has been ${newStatus === "OPEN" ? "opened" : "closed"}!`);
    } catch (error) {
      console.error("Error toggling registration status:", error);
      alert("Failed to toggle registration status.");
    }
  };

  // Load courses.json from the public folder
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/domain-config/`)
      .then(response => {
        const domainConfigs = response.data.map((dataPoint)=>{
          const domain = dataPoint.domain;
          const minCount = dataPoint.minCount;
          const maxCount = dataPoint.maxCount;
          return {domain, minCount, maxCount};
        }) || [];
        // ✅ Ensure domains are extracted correctly
        setDomainConfigs(domainConfigs);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/admin/login`, {
        username,
        password
      });
      if (response.data.message === "Login successful") {
        setIsAuthenticated(true);
        fetchData();
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        alert(error.response.data.message || "Incorrect username or password.");
      } else if (error.request) {
        alert("No response from server. Please check your connection.");
      } else {
        alert("Error setting up the request. Please try again.");
      }
    }
  };

  const fetchData = async () => {
    try {
      console.log("fetching data")
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty`);
      setFacultyData(response.data);
      await loadMissingFacultyData(response.data);

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
    if (isAuthenticated) {
      const intervalId = setInterval(() => {
        fetchData();
      }, 5000);
  
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [isAuthenticated]);

  const loadMissingFacultyData = async (facultyDataFromBackend) => {
    try {
      const response = await fetch("/faculties.json");
      const facultyJson = await response.json();
      setTotalFacultiesCount(facultyJson.length);

      // Filter faculties who haven't selected any courses (i.e., their `selectedCourses` is empty)
      const missingFaculties = facultyJson.filter(faculty => {
        const isRegisteredInBackend = facultyDataFromBackend.some(fac => fac.empId === faculty.empId);
        return !isRegisteredInBackend;
      });

      setMissingFacultyData(missingFaculties);
    } catch (error) {
      console.error("Error loading faculties.json:", error);
    }
  };

  const toggleFacultyTable = () => {
    setShowFacultyTable(!showFacultyTable);
  };

  const toggleMissingFacultyTable = () => {
    setShowMissingFacultyTable(!showMissingFacultyTable);
  };

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
        alert("Error uploading courses. Incorrect format. Try again.");
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

    const sortedfacultyData = [...facultyData].sort((a, b) => {
      const idA = a.empId;
      const idB = b.empId;

      if (typeof idA === 'number' && typeof idB === 'number') {
        return idA - idB;
      }
    });

    let sno = 1;
    sortedfacultyData.forEach(faculty => {
      faculty.selectedCourses.forEach((course, index) => {
        facultyExcelData.push({
          "S.No": sno,
          "Faculty Name": faculty.name,
          "Empld": faculty.empId,
          "Course Name": course.courseName,
          "Choice": `Choice ${index + 1}`,
          // "UG": faculty.ug,
          "UG SPL": faculty.ugspecialization,
          // "PG": faculty.pg,
          "PG SPL": faculty.pgspecialization,
          "RESEARCH DOMAIN": faculty.researchdomain,
          "Submission Time": faculty.submittedAt ? new Date(faculty.submittedAt).toLocaleString() : 'Not Submitted'
        });
      });
      facultyExcelData.push({});
      sno++;
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

  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/admin/forgot-password`, {
        username: resetUsername
      });
      setResetMessage('Your credentials have been sent to your email.');
      setResetError('');
      setShowForgotPassword(false);
      setResetUsername('');
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.response) {
        setResetError(error.response.data.message || 'Username not found. Please try again.');
      } else if (error.request) {
        setResetError('No response from server. Please check your connection.');
      } else {
        setResetError('Error setting up the request. Please try again.');
      }
      setResetMessage('');
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setResetError('New passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/admin/reset-password`, {
        username: resetUsername,
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      setResetMessage('Password has been reset successfully. Please login with your new password.');
      setResetError('');
      setShowResetModal(false);
      setResetUsername('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response) {
        setResetError(error.response.data.message || 'Failed to reset password. Please try again.');
      } else if (error.request) {
        setResetError('No response from server. Please check your connection.');
      } else {
        setResetError('Error setting up the request. Please try again.');
      }
      setResetMessage('');
    }
  };

  return (
    <div style={{ padding: "0px 100px" }}>
      <h1>Management Portal </h1>

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
            <div className="form-links">
              <button type="submit" className="login-button">Login</button>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
                <button 
                  type="button" 
                  className="reset-password-link"
                  onClick={() => setShowResetModal(true)}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </form>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="modal">
              <div className="modal-content">
                <h2>Forgot Password</h2>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
                {resetError && <p className="error">{resetError}</p>}
                {resetMessage && <p className="success">{resetMessage}</p>}
                <button onClick={handleForgotPassword}>Send Credentials</button>
                <button onClick={() => {
                  setShowForgotPassword(false);
                  setResetUsername('');
                  setResetError('');
                  setResetMessage('');
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {showResetModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Reset Password</h2>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Enter old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {resetError && <p className="error">{resetError}</p>}
                {resetMessage && <p className="success">{resetMessage}</p>}
                <button onClick={handleResetPassword}>Reset Password</button>
                <button onClick={() => {
                  setShowResetModal(false);
                  setResetUsername('');
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setResetError('');
                  setResetMessage('');
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
        <div><center>
        <button onClick={toggleRegistration} style={{ marginBottom: "20px" }}>
          {registrationStatus === "Loading" ? "Loading..." : registrationStatus === "OPEN" ? "Stop Registration" : "Start Registration"}
        </button></center>
      <h2>Domain Constraints</h2>
      {domainConfigs.map((config, index) => (
        <div key={index}>
          <h3>{config.domain}</h3>
          <label>Min:</label>
          <input 
            type="number" 
            defaultValue={config.minCount}
            onChange={(e) => handleInputChange(index, 'minCount', e.target.value)}
          />
          {"                "}
          <label>Max:</label>
          <input 
            type="number"
            defaultValue={config.maxCount}
            onChange={(e) => handleInputChange(index, 'maxCount', e.target.value)}
          />
        </div>
      ))}
      <button onClick={saveDomainConfig}>Save Settings</button>
    </div>

    <div>
      <h2>Upload Course Data (Excel to JSON)</h2>
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
          {"                "}
          <button onClick={handleDownloadFacultyExcel}>Download Faculty Excel</button>
          

          {showFacultyTable && (
            <>
          <div className="table-container">
          <h2>Faculty Course Selection ({facultyData.length} entries  / {totalFacultiesCount - 3} )</h2>
          <table border="1">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Faculty Name</th>
                <th>Employee ID</th>
                <th>Preference</th>
                <th>Selected Courses</th>
                {/*<th>UG</th>*/}
                <th>UG Specialization</th>
                {/*<th>PG</th>*/}
                <th>PG Specialization</th>
                <th>Research Domain</th>
                <th>Submission Time</th>
              </tr>
            </thead>
            <tbody>
              {facultyData.map((faculty,index) => (
                <tr key={faculty.empId}>
                  <td>{index + 1}</td> 
                  <td>{faculty.name}</td>
                  <td>{faculty.empId}</td>
                  <td>{faculty.preference}</td>
                  <td>{faculty.selectedCourses.map(course => course.courseName).join(", ")}</td>
                  {/*<td>{faculty.ug || "N/A"}</td>*/}
                  <td>{faculty.ugspecialization || "N/A"}</td>
                  {/*<td>{faculty.pg || "N/A"}</td>*/}
                  <td>{faculty.pgspecialization || "N/A"}</td>
                  <td>{faculty.researchdomain || "N/A"}</td>
                  <td>{faculty.submittedAt ? new Date(faculty.submittedAt).toLocaleString() : 'Not Submitted'}</td>
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

        {/* Toggle Missing Faculty Table */}
        <button onClick={toggleMissingFacultyTable}>
            {showMissingFacultyTable ? "Hide Missing Faculty Table" : "Show Missing Faculty Table"}
          </button><br></br>

          {/* Missing Faculty Table */}
          {showMissingFacultyTable && (
            <div className="table-container">
              <h2>Missing Faculty Data  ({missingFacultyData.length -3 } Not Entered)</h2>
              <table border="1">
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Faculty Name</th>
                    <th>Employee ID</th>
                    <th>Course Preference</th>
                  </tr>
                </thead>
                <tbody>
                  {missingFacultyData.length > 0 ? (
                    missingFacultyData.map((faculty, index) => (
                      <tr key={faculty.empId}>
                        <td>{index+1}</td>
                        <td>{faculty.name}</td>
                        <td>{faculty.empId}</td>
                        <td>{faculty.coursePreference || "N/A"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No missing faculty data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        <button onClick={() => setShowCourseTable(!showCourseTable)}>
          {showCourseTable ? "Hide Course Table" : "Show Course Table"}
        </button>
        {"                "}
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
                <td>
                  {facultyList.length > 0
                    ? facultyList.map(item => item.facultyName).join(", ")
                    : <span style={{ color: "red", fontStyle: "italic" }}>No faculty has chosen this course</span>
                  }
                </td>
                <td>
                  {facultyList.length > 0
                    ? facultyList.map(item => item.choice).join(", ")
                    : "-"
                  }
                </td>
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