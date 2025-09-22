import React, { useState, useEffect, useRef } from 'react';
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
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [maxRegistrations, setMaxRegistrations] = useState('');
  const [setMaxStatus, setSetMaxStatus] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch all courses for dropdown
  useEffect(() => {
    if (isAuthenticated) {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses`)
        .then(res => setAllCourses(res.data))
        .catch(() => setAllCourses([]));
    }
  }, [isAuthenticated]);

  // Auto-fill maxRegistrations when course is selected
  useEffect(() => {
    if (!selectedCourseId) {
      setMaxRegistrations('');
      return;
    }
    const course = allCourses.find(c => c.courseId === selectedCourseId);
    if (course && typeof course.maxRegistrations === 'number' && course.maxRegistrations > 0) {
      setMaxRegistrations(course.maxRegistrations.toString());
    } else if (course && (course.maxRegistrations === 0 || course.maxRegistrations === undefined || course.maxRegistrations === null)) {
      setMaxRegistrations('-');
    } else {
      setMaxRegistrations('');
    }
  }, [selectedCourseId, allCourses]);

  // Handler to set max registrations for a course
  const handleSetMaxRegistrations = async () => {
    if (!selectedCourseId || !maxRegistrations || maxRegistrations === '-') {
      setSetMaxStatus('Please select a course and enter a max value.');
      return;
    }
    let maxValue = Number(maxRegistrations);
    if (isNaN(maxValue) || maxValue < 0) {
      setSetMaxStatus('Please enter a valid non-negative number.');
      return;
    }
    try {
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/courses/set-max/${selectedCourseId}`, {
        maxRegistrations: maxValue
      });
      setSetMaxStatus(`Max registrations updated for ${response.data.course.courseName}`);
      // Update the course in allCourses to reflect the new max
      setAllCourses(prev => prev.map(c => c.courseId === selectedCourseId ? { ...c, maxRegistrations: maxValue } : c));
      setMaxRegistrations(maxValue.toString());
    } catch (err) {
      setSetMaxStatus('Failed to update max registrations.');
    }
  };

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
        setDomainConfigs(domainConfigs);
      })
      .catch(error => console.error("Error fetching domain configs from MongoDB:", error));
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
  
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const loadMissingFacultyData = async (facultyDataFromBackend) => {
    try {
      const response = await fetch("/faculties.json");
      const facultyJson = await response.json();
      setTotalFacultiesCount(facultyJson.length);

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

      const parsedData = XLSX.utils.sheet_to_json(sheet);
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

      const formattedCourses = Object.values(coursesMap);
      localStorage.setItem("uploadedCourses", JSON.stringify(formattedCourses));
      setUploadedCourses(formattedCourses);

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/courses/upload-courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedCourses),
        });

        if (!response.ok) throw new Error("Failed to upload courses");

        alert("✅ Courses uploaded to MongoDB successfully!");
        setCourses(formattedCourses);
      } catch (error) {
        console.error("❌ Error uploading courses:", error);
        alert("Error uploading courses. Incorrect format. Try again.");
      }

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
          "UG SPL": faculty.ugspecialization,
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
          "EmpId": facultyId,
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
    <div className="management-container">
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
          {/* Registration Status Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Registration Control</h2>
                <p className="section-description">Manage faculty registration status</p>
              </div>
            </div>
            <div className="registration-status">
              <div className={`status-indicator ${registrationStatus.toLowerCase()}`}></div>
              <span>Registration is currently <strong>{registrationStatus}</strong></span>
              <button 
                onClick={toggleRegistration} 
                className={registrationStatus === "OPEN" ? "btn-danger" : "btn-success"}
              >
                {registrationStatus === "Loading" ? "Loading..." : 
                 registrationStatus === "OPEN" ? "Stop Registration" : "Start Registration"}
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{facultyData.length}</div>
              <div className="stat-label">Registered Faculty</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalFacultiesCount - 3}</div>
              <div className="stat-label">Total Faculty</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{missingFacultyData.length - 3}</div>
              <div className="stat-label">Pending Registration</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{Object.keys(courseData).length}</div>
              <div className="stat-label">Courses Available</div>
            </div>
          </div>

          {/* Course Registration Limit Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Course Registration Limits</h2>
                <p className="section-description">Set maximum registration limits for courses</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Select Course:</label>
                <div className="dropdown-container" style={{ position: 'relative', zIndex: 100 }}>
                  <input
                    ref={inputRef => { if (inputRef) inputRef.setAttribute('autocomplete', 'off'); }}
                    type="text"
                    placeholder="Search by name or code..."
                    value={courseSearch}
                    onChange={e => {
                      setCourseSearch(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                    style={{ position: 'relative', zIndex: 101 }}
                  />
                  {dropdownOpen && (
                    <div className="dropdown-menu" style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      width: '100%',
                      maxHeight: 250,
                      overflowY: 'auto',
                      zIndex: 9999,
                      background: '#fff',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      border: '1px solid #e5e7eb',
                    }}>
                      {allCourses
                        .filter(course =>
                          course.courseName.toLowerCase().includes(courseSearch.toLowerCase()) ||
                          course.courseId.toLowerCase().includes(courseSearch.toLowerCase())
                        )
                        .map(course => (
                          <div
                            key={course.courseId}
                            className={`dropdown-item ${selectedCourseId === course.courseId ? 'selected' : ''}`}
                            onMouseDown={() => {
                              setSelectedCourseId(course.courseId);
                              setCourseSearch(`${course.courseName} (${course.courseId})`);
                              setDropdownOpen(false);
                            }}
                          >
                            {course.courseName} ({course.courseId})
                          </div>
                        ))}
                      {allCourses.filter(course =>
                        course.courseName.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        course.courseId.toLowerCase().includes(courseSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="dropdown-item">No courses found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Max Registrations:</label>
                <input
                  type="text"
                  min='0'
                  value={maxRegistrations}
                  onChange={e => setMaxRegistrations(e.target.value.replace(/[^\d-]/g, ''))}
                  placeholder="-"
                />
              </div>
              <button className="btn-primary" onClick={handleSetMaxRegistrations}>
                Set Limit
              </button>
            </div>
            {setMaxStatus && (
              <div className={`status-message ${setMaxStatus.startsWith('Max') ? 'success' : 'error'}`}>
                {setMaxStatus}
              </div>
            )}
          </div>

          {/* Domain Configuration Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Domain Constraints</h2>
                <p className="section-description">Configure minimum and maximum course selections per domain</p>
              </div>
              <button className="btn-success" onClick={saveDomainConfig}>
                Save Configuration
              </button>
            </div>
            <div className="domain-config">
              {domainConfigs.map((config, index) => (
                <div key={index} className="domain-item">
                  <h3>{config.domain}</h3>
                  <div className="domain-controls">
                    <label>Min:</label>
                    <input 
                      type="number" 
                      defaultValue={config.minCount}
                      onChange={(e) => handleInputChange(index, 'minCount', e.target.value)}
                    />
                    <label>Max:</label>
                    <input 
                      type="number"
                      defaultValue={config.maxCount}
                      onChange={(e) => handleInputChange(index, 'maxCount', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Data Upload Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Course Data Management</h2>
                <p className="section-description">Upload course data from Excel files</p>
              </div>
            </div>
            <div className="upload-section">
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileChange}
                  className="file-input"
                />
                <button className="btn-primary" onClick={handleUpload}>
                  Upload & Process
                </button>
              </div>
              {courses.length > 0 && (
                <div className="status-message success">
                  Successfully processed {courses.length} courses
                </div>
              )}
            </div>
          </div>

          {/* Faculty Data Tables Section */}
          <div className="dashboard-section">
            <div className="table-container">
              <div className="table-header">
                <h3 className="table-title">
                  Faculty Course Selection ({facultyData.length} entries / {totalFacultiesCount - 3})
                </h3>
                <div className="table-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowFacultyTable(!showFacultyTable)}
                  >
                    {showFacultyTable ? "Hide Table" : "Show Table"}
                  </button>
                  <button className="btn-success" onClick={handleDownloadFacultyExcel}>
                    Download Excel
                  </button>
                </div>
              </div>
              
              {showFacultyTable && (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Faculty Name</th>
                        <th>Employee ID</th>
                        <th>Preference</th>
                        <th>Selected Courses</th>
                        <th>UG Specialization</th>
                        <th>PG Specialization</th>
                        <th>Research Domain</th>
                        <th>Submission Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyData.map((faculty, index) => (
                        <tr key={faculty.empId}>
                          <td>{index + 1}</td>
                          <td>{faculty.name}</td>
                          <td>{faculty.empId}</td>
                          <td>
                            <span className={`badge ${faculty.preference === 'Theory' ? 'badge-info' : 'badge-warning'}`}>
                              {faculty.preference}
                            </span>
                          </td>
                          <td>{faculty.selectedCourses.map(course => course.courseName).join(", ")}</td>
                          <td>{faculty.ugspecialization || "N/A"}</td>
                          <td>{faculty.pgspecialization || "N/A"}</td>
                          <td>{faculty.researchdomain || "N/A"}</td>
                          <td>
                            {faculty.submittedAt 
                              ? new Date(faculty.submittedAt).toLocaleString() 
                              : 'Not Submitted'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Missing Faculty Section */}
          <div className="dashboard-section">
            <div className="table-container">
              <div className="table-header">
                <h3 className="table-title">
                  Missing Faculty Data ({missingFacultyData.length - 3} Not Entered)
                </h3>
                <div className="table-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={toggleMissingFacultyTable}
                  >
                    {showMissingFacultyTable ? "Hide Table" : "Show Table"}
                  </button>
                </div>
              </div>

              {showMissingFacultyTable && (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Faculty Name</th>
                        <th>Employee ID</th>
                        <th>Course Preference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingFacultyData.length > 0 ? (
                        missingFacultyData.map((faculty, index) => (
                          <tr key={faculty.empId}>
                            <td>{index + 1}</td>
                            <td>{faculty.name}</td>
                            <td>{faculty.empId}</td>
                            <td>{faculty.coursePreference || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)'}}>
                            No missing faculty data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Course Selection Data Section */}
          <div className="dashboard-section">
            <div className="table-container">
              <div className="table-header">
                <h3 className="table-title">
                  Courses Selected by Faculty
                </h3>
                <div className="table-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowCourseTable(!showCourseTable)}
                  >
                    {showCourseTable ? "Hide Table" : "Show Table"}
                  </button>
                  <button className="btn-success" onClick={handleDownloadCourseExcel}>
                    Download Excel
                  </button>
                </div>
              </div>

              {showCourseTable && (
                <div className="table-wrapper">
                  <table>
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
                          <td><strong>{courseName}</strong></td>
                          <td>
                            {facultyList.length > 0
                              ? facultyList.map(item => item.facultyName).join(", ")
                              : <span style={{ color: "var(--danger-color)", fontStyle: "italic" }}>
                                  No faculty has chosen this course
                                </span>
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
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Management;
