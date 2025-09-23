import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Management.css';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '⚠';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast ${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// Toast container component
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Management = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [facultyData, setFacultyData] = useState([]);
  const [courseData, setCourseData] = useState({});
  const [uploadedCourses, setUploadedCourses] = useState([]);
  const [showFacultyTable, setShowFacultyTable] = useState(true);
  const [showCourseTable, setShowCourseTable] = useState(true);
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
  const dropdownRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  // Toast management functions
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/courses/set-max/${selectedCourseId}`, { maxRegistrations: maxValue });
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
      addToast(`Registration has been ${newStatus === "OPEN" ? "opened" : "closed"}!`, 'success');
    } catch (error) {
      console.error("Error toggling registration status:", error);
      addToast("Failed to toggle registration status.", 'error');
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
      addToast("Domain constraints updated successfully!", 'success');
    } catch (error) {
      console.error("Error saving domain constraints:", error);
      addToast("Failed to update constraints.", 'error');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      addToast('Please enter both username and password', 'warning');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/admin/login`, {
        username,
        password
      });

      if (response.data.message === "Login successful") {
        setIsAuthenticated(true);
        addToast('Login successful! Welcome to management dashboard', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        addToast(error.response.data.message || "Incorrect username or password", 'error');
      } else if (error.request) {
        addToast("No response from server. Please check your connection", 'error');
      } else {
        addToast("Error setting up the request. Please try again", 'error');
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

  const toggleCourseTable = () => {
    setShowCourseTable(!showCourseTable);
  };

  const toggleMissingFacultyTable = () => {
    setShowMissingFacultyTable(!showMissingFacultyTable);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      addToast("Please select a file first.", 'warning');
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
        addToast("Courses uploaded to MongoDB successfully!", 'success');
        setCourses(formattedCourses);
      } catch (error) {
        console.error("Error uploading courses:", error);
        addToast("Error uploading courses. Incorrect format. Try again.", 'error');
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
    if (!resetUsername.trim()) {
      setResetError('Please enter your username');
      return;
    }

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
    if (!resetUsername.trim() || !oldPassword.trim() || !newPassword.trim()) {
      setResetError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long');
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

  // Dropdown click-outside handler
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Login form
  if (!isAuthenticated) {
    return (
      <>
        <div className="management-container">
          <h1></h1>

          <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
              <h2>Admin Login</h2>

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
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button type="submit" className="login-button">
                Sign In
              </button>

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
            </form>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="modal">
              <div className="modal-content">
                <h2>Forgot Password</h2>
                {resetError && <div className="error">{resetError}</div>}
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
                <button onClick={handleForgotPassword}>Send Credentials</button>
                <button onClick={() => setShowForgotPassword(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {showResetModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Reset Password</h2>
                {resetError && <div className="error">{resetError}</div>}
                <input
                  type="text"
                  placeholder="Username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button onClick={handleResetPassword}>Reset Password</button>
                <button onClick={() => setShowResetModal(false)}>Cancel</button>
              </div>
            </div>
          )}

          {resetMessage && (
            <div className="success" style={{ margin: '20px auto', maxWidth: '400px' }}>
              {resetMessage}
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Main dashboard
  return (
    <>
      <div className="management-container">
        <h1></h1>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-number">{facultyData.length}</h3>
            <p className="stat-label">Registered Faculties</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{totalFacultiesCount}</h3>
            <p className="stat-label">Total Faculties</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{missingFacultyData.length}</h3>
            <p className="stat-label">Pending Registrations</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{Object.keys(courseData).length}</h3>
            <p className="stat-label">Active Courses</p>
          </div>
        </div>

        {/* Registration Status Control */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Registration Control</h3>
              <p className="section-description">Manage faculty registration status</p>
            </div>
          </div>

          <div className="registration-status">
            <div className={`status-indicator ${registrationStatus === "CLOSED" ? "closed" : ""}`}></div>
            <span>Registration is currently <strong>{registrationStatus}</strong></span>
            <button 
              onClick={toggleRegistration} 
              className={registrationStatus === "OPEN" ? "btn-danger" : "btn-success"}
            >
              {registrationStatus === "OPEN" ? "Close Registration" : "Open Registration"}
            </button>
          </div>
        </div>

        {/* Course Max Registration Control */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Course Limits</h3>
              <p className="section-description">Set maximum registration limits for courses</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Select Course</label>
              <div
                className="dropdown-container"
                style={{ position: 'relative', width: '100%' }}
                ref={dropdownRef}
              >
                <div
                  className="dropdown-selected"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '10px',
                    background: '#fff',
                    cursor: 'pointer',
                    minHeight: '40px',
                  }}
                  onClick={() => setDropdownOpen((open) => !open)}
                >
                  {selectedCourseId
                    ? `${allCourses.find(c => c.courseId === selectedCourseId)?.courseName || ''} (${selectedCourseId})`
                    : 'Choose a course...'}
                </div>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0 0 6px 6px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      maxHeight: 250,
                      overflowY: 'auto',
                    }}
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search by name or code..."
                      value={courseSearch}
                      onChange={e => setCourseSearch(e.target.value)}
                      style={{
                        width: '96%',
                        margin: '8px 2%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {allCourses
                      .filter(course =>
                        course.courseName.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        course.courseId.toLowerCase().includes(courseSearch.toLowerCase())
                      )
                      .map(course => (
                        <div
                          key={course.courseId}
                          className={`dropdown-item${selectedCourseId === course.courseId ? ' selected' : ''}`}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            background: selectedCourseId === course.courseId ? '#f0f0ff' : '#fff',
                          }}
                          onMouseDown={() => {
                            setSelectedCourseId(course.courseId);
                            setCourseSearch('');
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
                      <div style={{ padding: '10px', color: '#888' }}>No courses found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Max Registrations</label>
              <input
                type="number"
                min="0"
                value={maxRegistrations}
                onChange={(e) => setMaxRegistrations(e.target.value)}
                placeholder="Enter max limit"
              />
            </div>
            <button onClick={handleSetMaxRegistrations} className="btn-primary">
              Set Limit
            </button>
          </div>
          {setMaxStatus && <div className="success">{setMaxStatus}</div>}
        </div>

        {/* Domain Configuration */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Domain Constraints</h3>
              <p className="section-description">Configure minimum and maximum course selections per domain</p>
            </div>
            <button onClick={saveDomainConfig} className="btn-success">
              Save Configuration
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Minimum Courses</th>
                  <th>Maximum Courses</th>
                </tr>
              </thead>
              <tbody>
                {domainConfigs.map((config, index) => (
                  <tr key={index}>
                    <td>{config.domain}</td>
                    <td>
                      <input
                        type="number"
                        value={config.minCount}
                        onChange={(e) => handleInputChange(index, 'minCount', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={config.maxCount}
                        onChange={(e) => handleInputChange(index, 'maxCount', e.target.value)}
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Upload */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Course Management</h3>
              <p className="section-description">Upload course data from Excel files</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Select Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            <button onClick={handleUpload} className="btn-primary">
              Upload Courses
            </button>
          </div>
        </div>

        {/* Faculty Data Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Faculty Course Selections ({facultyData.length})</h3>
            <div className="table-actions">
              <button onClick={handleDownloadFacultyExcel} className="btn-success">
                Download Excel
              </button>
              <button onClick={toggleFacultyTable} className="btn-secondary">
                {showFacultyTable ? 'Hide' : 'Show'} Table
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
                      <td>{faculty.preference}</td>
                      <td>{faculty.selectedCourses.map(course => course.courseName).join(", ")}</td>
                      <td>{faculty.ugspecialization || "N/A"}</td>
                      <td>{faculty.pgspecialization || "N/A"}</td>
                      <td>{faculty.researchdomain || "N/A"}</td>
                      <td>{faculty.submittedAt ? new Date(faculty.submittedAt).toLocaleString() : 'Not Submitted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Missing Faculty Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Missing Faculty Registrations ({missingFacultyData.length})</h3>
            <div className="table-actions">
              <button onClick={toggleMissingFacultyTable} className="btn-secondary">
                {showMissingFacultyTable ? 'Hide' : 'Show'} Table
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
                      <td colSpan="4">No missing faculty data found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course Selection Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Course-wise Faculty Selection</h3>
            <div className="table-actions">
              <button onClick={handleDownloadCourseExcel} className="btn-success">
                Download Excel
              </button>
              <button onClick={toggleCourseTable} className="btn-secondary">
                {showCourseTable ? 'Hide' : 'Show'} Table
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
                      <td>{courseName}</td>
                      <td>
                        {facultyList.length > 0 
                          ? facultyList.map(item => item.facultyName).join(", ") 
                          : "No faculty has chosen this course"
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default Management;