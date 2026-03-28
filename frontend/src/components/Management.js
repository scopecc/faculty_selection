import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Management.css';

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

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Management = ({ onAuthChange }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [facultyData, setFacultyData] = useState([]);
  const [courseData, setCourseData] = useState({});
  const [uploadedCourses, setUploadedCourses] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [domainConfigs, setDomainConfigs] = useState([]);
  const [file, setFile] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState("Loading");
  const [missingFacultyData, setMissingFacultyData] = useState([]);
  const [totalFacultiesCount, setTotalFacultiesCount] = useState(0);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [maxRegistrations, setMaxRegistrations] = useState('');
  const [setMaxStatus, setSetMaxStatus] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  // Draft state
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [newDraftName, setNewDraftName] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');

  // New UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [facultySearchFilter, setFacultySearchFilter] = useState('');
  const [courseSearchFilter, setCourseSearchFilter] = useState('');
  const [pendingSearchFilter, setPendingSearchFilter] = useState('');

  useEffect(() => {
    setDraftLoading(true);
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/drafts/list`)
      .then(res => {
        let sortedDrafts = [...res.data].sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return (b._id || '').localeCompare(a._id || '');
        });
        setDrafts(sortedDrafts);
        setSelectedDraft(sortedDrafts[0] || null);
        setDraftLoading(false);
      })
      .catch(() => {
        setDrafts([]);
        setDraftLoading(false);
      });
  }, []);

  const handleCreateDraft = async () => {
    if (!newDraftName.trim()) {
      setDraftError('Draft name required');
      return;
    }
    setDraftLoading(true);
    setDraftError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/drafts/create`, { name: newDraftName });
      setDrafts(prev => [res.data.draft, ...prev]);
      setSelectedDraft(res.data.draft);
      setNewDraftName('');
      setDraftLoading(false);
    } catch (err) {
      setDraftError(err.response?.data?.message || 'Failed to create draft');
      setDraftLoading(false);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

  useEffect(() => {
    if (isAuthenticated && selectedDraft) {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses`, { params: { draftId: selectedDraft._id } })
        .then(res => setAllCourses(res.data))
        .catch(() => setAllCourses([]));
    }
  }, [isAuthenticated, selectedDraft]);

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

  const handleSetMaxRegistrations = async () => {
    if (!selectedCourseId || !maxRegistrations || maxRegistrations === '-') {
      setSetMaxStatus('Select a course and enter max value.');
      return;
    }
    let maxValue = Number(maxRegistrations);
    if (isNaN(maxValue) || maxValue < 0) {
      setSetMaxStatus('Enter a valid non-negative number.');
      return;
    }
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/courses/set-max/${selectedCourseId}`,
        { maxRegistrations: maxValue, draftId: selectedDraft?._id }
      );
      setSetMaxStatus(`Max updated for ${response.data.course.courseName}`);
      setAllCourses(prev => prev.map(c => c.courseId === selectedCourseId ? { ...c, maxRegistrations: maxValue } : c));
      setMaxRegistrations(maxValue.toString());
      setTimeout(() => setSetMaxStatus(''), 3000);
    } catch (err) {
      setSetMaxStatus('Failed to update max registrations.');
    }
  };

  useEffect(() => {
    if (!selectedDraft) return;
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/registration-status`, { params: { draftId: selectedDraft._id } })
      .then(response => setRegistrationStatus(response.data.status))
      .catch(() => setRegistrationStatus("CLOSED"));
  }, [selectedDraft]);

  const toggleRegistration = async () => {
    if (!selectedDraft) return;
    const newStatus = registrationStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/registration-status`, { status: newStatus, draftId: selectedDraft._id });
      setRegistrationStatus(newStatus);
      addToast(`Registration has been ${newStatus === "OPEN" ? "opened" : "closed"}!`, 'success');
    } catch (error) {
      addToast("Failed to toggle registration status.", 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated && selectedDraft) {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/domain-config/`, { params: { draftId: selectedDraft._id } })
        .then(response => setDomainConfigs(response.data.map(d => ({ domain: d.domain, minCount: d.minCount, maxCount: d.maxCount })) || []))
        .catch(error => console.error(error));
    }
  }, [isAuthenticated, selectedDraft]);

  const handleInputChange = (index, field, value) => {
    const updatedConfigs = [...domainConfigs];
    updatedConfigs[index][field] = Number(value);
    setDomainConfigs(updatedConfigs);
  };

  const saveDomainConfig = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/domain-config/save`, { domainConfigs, draftId: selectedDraft?._id });
      addToast("Domain constraints updated!", 'success');
    } catch (error) {
      addToast("Failed to update constraints.", 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Enter username and password', 'warning');
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/admin/login`, { username, password });
      if (response.data.message === "Login successful") {
        setIsAuthenticated(true);
        if (onAuthChange) onAuthChange(true);
        addToast('Login successful', 'success');
        fetchData();
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Incorrect details", 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (onAuthChange) onAuthChange(false);
    setUsername('');
    setPassword('');
  };

  const fetchData = async () => {
    try {
      if (!selectedDraft) return;
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty`, { params: { draftId: selectedDraft._id } });
      setFacultyData(response.data);
      await loadMissingFacultyData(response.data);
      const courseMap = {};
      response.data.forEach(faculty => {
        faculty.selectedCourses.forEach((course, index) => {
          if (!courseMap[course.courseName]) courseMap[course.courseName] = [];
          courseMap[course.courseName].push({ facultyName: faculty.name, choice: `Choice ${index + 1}`, facultyId: faculty.empId });
        });
      });
      setCourseData(courseMap);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && selectedDraft) fetchData();
  }, [isAuthenticated, selectedDraft]);

  const loadMissingFacultyData = async (facultyDataFromBackend) => {
    try {
      const response = await fetch("/faculties.json");
      const facultyJson = await response.json();
      setTotalFacultiesCount(facultyJson.length);
      setMissingFacultyData(facultyJson.filter(faculty => !facultyDataFromBackend.some(fac => fac.empId === faculty.empId)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = () => {
    if (!file) { addToast("Select a file first.", 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      let jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      jsonData = jsonData.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => {
          normalized[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        });
        return {
          courseId: (normalized['courseid'] || normalized['course_id'] || '').toString().trim(),
          courseName: (normalized['coursename'] || normalized['course_name'] || '').toString().trim(),
          domain: (normalized['domain'] || '').toString().trim(),
          courseType: (normalized['coursetype'] || normalized['course_type'] || '').toString().trim(),
        };
      });

      // Filter out completely blank or corrupted rows implicitly created by trailing spaces on blank excel cells
      jsonData = jsonData.filter(row => row.courseId && row.courseName);
      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/courses/upload-courses`, { courses: jsonData, draftId: selectedDraft?._id });
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/domain-config/insert-courses`, { courses: jsonData, draftId: selectedDraft?._id });
        addToast("Courses uploaded successfully!", 'success');
        setUploadedCourses(jsonData);
        fetchData();
      } catch (error) { addToast("Upload failed.", 'error'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadFacultyExcel = () => {
    const facultyExcelData = [];
    const sorted = [...facultyData].sort((a, b) => (typeof a.empId === 'number' && typeof b.empId === 'number') ? a.empId - b.empId : 0);
    let sno = 1;
    sorted.forEach(faculty => {
      faculty.selectedCourses.forEach((course, index) => {
        facultyExcelData.push({ "S.No": sno++, "Faculty Name": faculty.name, "Empld": faculty.empId, "Course Name": course.courseName, "Choice": `Choice ${index + 1}`, "UG SPL": faculty.ugspecialization, "PG SPL": faculty.pgspecialization, "RESEARCH DOMAIN": faculty.researchdomain, "Submission Time": faculty.submittedAt ? new Date(faculty.submittedAt).toLocaleString() : 'Not Submitted' });
      });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(facultyExcelData), "Faculty Selection");
    XLSX.writeFile(wb, "faculty_course_selection.xlsx");
  };

  const handleDownloadCourseExcel = () => {
    const courseExcelData = [];
    Object.entries(courseData).forEach(([courseName, facultyList]) => {
      facultyList.forEach(({ facultyName, choice, facultyId }) => courseExcelData.push({ "Course Name": courseName, "EmpId": facultyId, "Faculty Name": facultyName, "Choice": choice }));
      courseExcelData.push({});
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(courseExcelData), "Course Selection");
    XLSX.writeFile(wb, "course_selection.xlsx");
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!isAuthenticated) {
    return (
      <div className="admin-body">
        <div className="login-container">
          <form onSubmit={handleLogin} className="login-form">
            <h2>Admin Login</h2>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <div className="password-container">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            <button type="submit" className="login-button">Sign In</button>
          </form>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  const filteredFaculties = facultyData.filter(fac => fac.name.toLowerCase().includes(facultySearchFilter.toLowerCase()) || fac.empId.toString().includes(facultySearchFilter));
  const filteredCourses = Object.entries(courseData).filter(([courseName]) => courseName.toLowerCase().includes(courseSearchFilter.toLowerCase()));
  const filteredPending = missingFacultyData.filter(fac => fac.name.toLowerCase().includes(pendingSearchFilter.toLowerCase()) || fac.empId.toString().includes(pendingSearchFilter));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="overview-grid">
              <div className="overview-card"><span className="card-label">Total Faculties (M/S)</span><h3 className="card-value">{totalFacultiesCount}</h3></div>
              <div className="overview-card"><span className="card-label">Registered Faculties</span><h3 className="card-value blue">{facultyData.length}</h3></div>
              <div className="overview-card"><span className="card-label">Pending Registrations</span><h3 className="card-value orange">{missingFacultyData.length}</h3></div>
              <div className="overview-card"><span className="card-label">Active Courses Selected</span><h3 className="card-value green">{Object.keys(courseData).length}</h3></div>
            </div>
            <div className="dashboard-actions-grid">
              <div className="action-panel">
                <h3>Registration Control</h3>
                <p>Toggle faculty registration portal ON/OFF globally for this draft.</p>
                <div className={`reg-status-badge ${registrationStatus === 'CLOSED' ? 'closed' : ''}`}>
                  <div className="reg-indicator"></div>{registrationStatus}
                </div>
                <div><button onClick={toggleRegistration} className={`btn-admin ${registrationStatus === 'OPEN' ? 'btn-danger' : 'btn-success'}`}>{registrationStatus === "OPEN" ? "Close Registration" : "Open Registration"}</button></div>
              </div>
              <div className="action-panel">
                <h3>Course Max Limit</h3>
                <p>Override the maximum slots available for a course constraint.</p>
                <div className="form-group" style={{ position: 'relative' }}>
                  <div className="dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
                    <div className="dropdown-selected" onClick={() => setDropdownOpen(!dropdownOpen)}>{selectedCourseId ? `${allCourses.find(c => c.courseId === selectedCourseId)?.courseName || ''} (${selectedCourseId})` : 'Choose a course...'}</div>
                    {dropdownOpen && (
                      <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', zIndex: 100, maxHeight: 250, overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <input type="text" autoFocus placeholder="Search course..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="admin-input" style={{ width: '96%', margin: '2%' }} />
                        {allCourses.filter(c => c.courseName.toLowerCase().includes(courseSearch.toLowerCase()) || c.courseId.toLowerCase().includes(courseSearch.toLowerCase())).map(course => (
                          <div key={course.courseId} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }} onMouseDown={() => { setSelectedCourseId(course.courseId); setCourseSearch(''); setDropdownOpen(false); }}>{course.courseName} ({course.courseId})</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" min="0" value={maxRegistrations} onChange={e => setMaxRegistrations(e.target.value)} placeholder="Max Limit" className="admin-input" />
                  <button onClick={handleSetMaxRegistrations} className="btn-admin">Set</button>
                </div>
                {setMaxStatus && <div style={{ marginTop: '8px', color: '#10b981', fontSize: '14px' }}>{setMaxStatus}</div>}
              </div>
              <div className="action-panel" style={{ gridColumn: '1 / -1' }}>
                <h3>Course Data Upload</h3>
                <p>Upload Excel file containing latest curriculum courses to add/update existing catalog for this Draft.</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files[0])} /><button onClick={handleUpload} className="btn-admin">Upload File</button></div>
              </div>
              <div className="action-panel" style={{ gridColumn: '1 / -1' }}>
                <h3>Create New Semester</h3>
                <p>Initialize a fresh container to hold registrations and rules for a new semester.</p>
                <div style={{ display: 'flex', gap: '8px', maxWidth: '450px' }}>
                  <input type="text" placeholder="Semester Name (e.g. Fall 2026)" value={newDraftName} onChange={e => setNewDraftName(e.target.value)} className="admin-input" />
                  <button onClick={handleCreateDraft} className="btn-admin">Create</button>
                </div>
                {draftError && <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>{draftError}</div>}
              </div>
            </div>
          </>
        );
      case 'faculties':
        return (
          <div className="admin-table-container">
            <div className="table-toolbar">
              <h3>Registered Faculties ({filteredFaculties.length})</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" className="table-search" placeholder="Search by name or ID..." value={facultySearchFilter} onChange={e => setFacultySearchFilter(e.target.value)} />
                <button onClick={handleDownloadFacultyExcel} className="btn-admin btn-success">Download Excel</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>S.No</th><th>Name</th><th>Employee ID</th><th>Selected Courses</th><th>Willingness</th><th>Submitted At</th></tr>
                </thead>
                <tbody>
                  {filteredFaculties.map((fac, i) => (
                    <tr key={fac.empId}><td>{i + 1}</td><td style={{ fontWeight: 500 }}>{fac.name}</td><td>{fac.empId}</td><td>{fac.selectedCourses.map(c => c.courseName).join(", ") || '-'}</td><td>{fac.willingness ? 'Yes' : 'No'}</td><td style={{ color: '#64748b' }}>{fac.submittedAt ? new Date(fac.submittedAt).toLocaleDateString() : 'N/A'}</td></tr>
                  ))}
                  {filteredFaculties.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No faculties found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="admin-table-container">
            <div className="table-toolbar">
              <h3>Course Bookings ({filteredCourses.length})</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" className="table-search" placeholder="Search by course name..." value={courseSearchFilter} onChange={e => setCourseSearchFilter(e.target.value)} />
                <button onClick={handleDownloadCourseExcel} className="btn-admin btn-success">Download Excel</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th style={{ width: '40%' }}>Course Name</th><th>Selected by Faculty</th><th>Choice Level</th></tr>
                </thead>
                <tbody>
                  {filteredCourses.map(([courseName, facultyList]) => (
                    <tr key={courseName}><td style={{ fontWeight: 500 }}>{courseName}</td><td>{facultyList.map(item => item.facultyName).join(", ") || "-"}</td><td>{facultyList.map(item => item.choice).join(", ") || "-"}</td></tr>
                  ))}
                  {filteredCourses.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No courses found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="admin-table-container">
            <div className="table-toolbar">
              <h3>Missing Registrations ({filteredPending.length})</h3>
              <input type="text" className="table-search" placeholder="Search pending faculties..." value={pendingSearchFilter} onChange={e => setPendingSearchFilter(e.target.value)} />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>S.No</th><th>Faculty Name</th><th>Employee ID</th><th>Course Preference Info</th></tr>
                </thead>
                <tbody>
                  {filteredPending.map((fac, i) => (
                    <tr key={fac.empId}><td>{i + 1}</td><td style={{ fontWeight: 500 }}>{fac.name}</td><td>{fac.empId}</td><td>{fac.coursePreference || "N/A"}</td></tr>
                  ))}
                  {filteredPending.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>All registered or no match!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'domain':
        return (
          <div className="admin-table-container">
            <div className="table-toolbar">
              <h3>Domain Config & Limits</h3>
              <button onClick={saveDomainConfig} className="btn-admin btn-success">Save Configuration</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Domain</th><th>Minimum Limit</th><th>Maximum Limit</th></tr>
                </thead>
                <tbody>
                  {domainConfigs.map((config, index) => (
                    <tr key={config.domain + index}>
                      <td style={{ fontWeight: 500 }}>{config.domain}</td>
                      <td><input type="number" value={config.minCount} onChange={e => handleInputChange(index, 'minCount', e.target.value)} min="0" className="admin-input" style={{ maxWidth: '120px' }} /></td>
                      <td><input type="number" value={config.maxCount} onChange={e => handleInputChange(index, 'maxCount', e.target.value)} min="0" className="admin-input" style={{ maxWidth: '120px' }} /></td>
                    </tr>
                  ))}
                  {domainConfigs.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No domains found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="admin-body">
      <div className="admin-dashboard">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-avatar">A</div>
            <div className="admin-brand"><h2>Admin Panel</h2><p>Faculty System</p></div>
          </div>
          <nav className="admin-nav">
            <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><span>Overview</span></button>
            <button className={`admin-nav-item ${activeTab === 'faculties' ? 'active' : ''}`} onClick={() => setActiveTab('faculties')}><span>Registered Faculties</span></button>
            <button className={`admin-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}><span>Course Bookings</span></button>
            <button className={`admin-nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}><span>Pending Faculties</span></button>
            <button className={`admin-nav-item ${activeTab === 'domain' ? 'active' : ''}`} onClick={() => setActiveTab('domain')}><span>Domain Config</span></button>
          </nav>
          <div className="admin-logout">
            <button className="admin-nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}><span>Sign Out</span></button>
          </div>
        </aside>

        {/* Main Interface */}
        <main className="admin-main">
          {/* Top Header */}
          <header className="admin-top-header">
            <div className="header-title">
              <h1 style={{ textTransform: 'capitalize' }}>{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h1>
            </div>
            <div className="header-actions">
              <div className="draft-selector-group">
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Semester:</span>
                <select value={selectedDraft ? selectedDraft._id : ''} onChange={e => setSelectedDraft(drafts.find(d => d._id === e.target.value) || null)} disabled={draftLoading}>
                  <option value="">Select Semester...</option>
                  {drafts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </header>

          <div className="admin-content-area">
            {!selectedDraft ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p>Welcome. Please select a semester or create a new one to begin.</p>
                <div className="action-panel" style={{ maxWidth: '450px', margin: '2rem auto', textAlign: 'left' }}>
                  <h3>Create New Semester</h3>
                  <p>Initialize a fresh system state container for a new registration era.</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Draft Name" value={newDraftName} onChange={e => setNewDraftName(e.target.value)} className="admin-input" />
                    <button onClick={handleCreateDraft} className="btn-admin">Create</button>
                  </div>
                  {draftError && <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>{draftError}</div>}
                </div>
              </div>
            ) : renderTabContent()}
          </div>
        </main>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default Management;