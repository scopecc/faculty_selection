import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseSelection.css';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item">
      <h3 onClick={() => setIsOpen(!isOpen)} className="accordion-title">
        {title}
      </h3>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};


const CourseSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from location state or fallback to localStorage
  const storedEmpId = sessionStorage.getItem('empId') || localStorage.getItem('empId');
  const storedFacultyEmail = sessionStorage.getItem('facultyEmail') || localStorage.getItem('facultyEmail');
  const storedDraftId = sessionStorage.getItem('draftId') || localStorage.getItem('draftId');

  const empId = location.state?.empId || storedEmpId;
  const facultyEmail = location.state?.facultyEmail || storedFacultyEmail;
  const draftId = location.state?.draftId || storedDraftId || null;

  // Session state restoration
  const [name, setName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState(() => JSON.parse(sessionStorage.getItem('selectedCourses')) || []);
  const [ugspecialization, setUgspecialization] = useState(() => sessionStorage.getItem('ugspecialization') || '');
  const [pgspecialization, setPgspecialization] = useState(() => sessionStorage.getItem('pgspecialization') || '');
  const [researchDomain, setResearchDomain] = useState(() => sessionStorage.getItem('researchDomain') || '');
  const [domainConstraints, setDomainConstraints] = useState({});
  const [willingness, setWillingness] = useState(() => {
    const w = sessionStorage.getItem('willingness');
    return w !== null ? JSON.parse(w) : null;
  });
  const [registrationStatus, setRegistrationStatus] = useState(null);

  // Route protection
  useEffect(() => {
    if (!empId || !facultyEmail) {
      navigate('/');
    } else {
      sessionStorage.setItem('empId', empId);
      sessionStorage.setItem('facultyEmail', facultyEmail);
      if (draftId) sessionStorage.setItem('draftId', draftId);
    }
  }, [empId, facultyEmail, draftId, navigate]);

  // Persist form state
  useEffect(() => {
    sessionStorage.setItem('selectedCourses', JSON.stringify(selectedCourses));
    sessionStorage.setItem('ugspecialization', ugspecialization);
    sessionStorage.setItem('pgspecialization', pgspecialization);
    sessionStorage.setItem('researchDomain', researchDomain);
    sessionStorage.setItem('willingness', JSON.stringify(willingness));
  }, [selectedCourses, ugspecialization, pgspecialization, researchDomain, willingness]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('/');
  };

  const [draggedCourseIndex, setDraggedCourseIndex] = useState(null);
  const [dragOverCourseIndex, setDragOverCourseIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedCourseIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverCourseIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedCourseIndex !== null && draggedCourseIndex !== index) {
      const updatedCourses = [...selectedCourses];
      const draggedCourse = updatedCourses[draggedCourseIndex];
      updatedCourses.splice(draggedCourseIndex, 1);
      updatedCourses.splice(index, 0, draggedCourse);
      setSelectedCourses(updatedCourses);
    }
    setDraggedCourseIndex(null);
    setDragOverCourseIndex(null);
    e.target.classList.remove('dragging');
  };

  const handleDragEnd = (e) => {
    setDraggedCourseIndex(null);
    setDragOverCourseIndex(null);
    e.target.classList.remove('dragging');
  };

  const [userDomain, setUserDomain] = useState(null);

  useEffect(() => {
    if (facultyEmail) {
      axios.get('faculties.json')
        .then(response => {
          const faculty = response.data.find(fac => fac.email === facultyEmail);
          if (faculty) {
            setName(faculty.name);
            setUserDomain(faculty.domain || null);
          } else {
            setName('Unknown Faculty');
            setUserDomain(null);
          }
        })
        .catch(error => console.error("Error fetching faculty data:", error));
    }
  }, [facultyEmail]);

  // Cleanup old useEffects as we merged them above.
const [theoryCoursesByDomain, setTheoryCoursesByDomain] = useState({});
const [theoryLabCoursesByDomain, setTheoryLabCoursesByDomain] = useState({});
const [courses, setCourses] = useState([]);
const [isCoursesFetched, setIsCoursesFetched] = useState(false);
const [courseRegCounts, setCourseRegCounts] = useState({});

// Fetch registration status when component mounts or draftId changes
useEffect(() => {
  if (!draftId) {
    setRegistrationStatus("CLOSED");
    return;
  }
  axios.get(`${process.env.REACT_APP_BACKEND_URL}/registration-status`, { 
    params: { draftId } 
  })
    .then(res => {
      setRegistrationStatus(res.data.status || "CLOSED");
    })
    .catch(() => {
      setRegistrationStatus("CLOSED");
    });
}, [draftId]);

// Fetch course data and registration counts
useEffect(() => {
  if (!draftId) return;
  localStorage.setItem('draftId', draftId);
  const fetchCoursesAndCounts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses`, { params: { draftId } });
      let updatedCourses = [];
      if (Array.isArray(response.data) && response.data.length > 0) {
        updatedCourses = response.data.map(course => ({
          ...course,
          courseType: course.courseType?.trim().toLowerCase() || "undefined",
        }));
        setCourses(updatedCourses);
      } else {
        setCourses([]);
      }
      // Fetch registration counts for all courses
      const regRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty`, { params: { draftId } });
      const regCounts = {};
      regRes.data.forEach(fac => {
        (fac.selectedCourses || []).forEach(c => {
          regCounts[c.courseId] = (regCounts[c.courseId] || 0) + 1;
        });
      });
      setCourseRegCounts(regCounts);
    } catch (error) {
      console.error("Error fetching courses or registration counts:", error);
      setCourses([]);
      setCourseRegCounts({});
    }
  };
  fetchCoursesAndCounts();
}, [draftId]);


const groupByDomain = (courses) => {
  return courses.reduce((acc, course) => {
    if (!acc[course.domain]) {
      acc[course.domain] = [];
    }
    acc[course.domain].push(course);
    return acc;
  }, {});
};

useEffect(() => {
  if (Array.isArray(courses) && courses.length > 0 && !isCoursesFetched) {

    // ✅ Make sure `courseType` is normalized properly
    const theoryCourses = courses.filter(course => 
      course.courseType && course.courseType.trim().toLowerCase() === "theory"
    );
    
    const theoryLabCourses = courses.filter(course => 
      course.courseType && course.courseType.trim().toLowerCase() === "theory+lab"
    );


    setTheoryCoursesByDomain(groupByDomain(theoryCourses));
    setTheoryLabCoursesByDomain(groupByDomain(theoryLabCourses));
    setIsCoursesFetched(true);
  }
}, [courses]); // ✅ Dependency on `courses`

  useEffect(() => {
    if (!draftId) return;
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/domain-config`, { params: { draftId } })
      .then(response => {
        const constraints = response.data.reduce((acc, config) => {
          acc[config.domain] = { minCount: config.minCount, maxCount: config.maxCount };
          return acc;
        }, {});
        setDomainConstraints(constraints);
      })
      .catch(error => console.error("Error fetching domain constraints:", error));
  }, [draftId]);

  const maxCourses = 7

  const handleCourseSelect = (course) => {
    setSelectedCourses(prev => {
      if (prev.length >= maxCourses && !prev.some(c => c.courseId === course.courseId)) {
        alert(`You can only select exactly ${maxCourses} courses.`);
        return prev;
      }

      const domainLimit = domainConstraints[course.domain] || { minCount: 0, maxCount: 2 };
      const domainCount = prev.filter(c => c.domain === course.domain).length;

      if (domainCount >= domainLimit.maxCount && !prev.some(c => c.courseId === course.courseId)) {
        alert(`You can only select up to ${domainLimit.maxCount} courses from the ${course.domain} domain.`);
        return prev;
      }

      if (prev.some(c => c.courseId === course.courseId)) {
        return prev.filter(c => c.courseId !== course.courseId);
      }

      return [...prev, course];
    });
  };
  const handleSubmit = async () => {
    // 1. Willingness must be selected
    if (willingness === null) {
      alert("Please select Yes or No for willingness to take an extra course before submitting.");
      return;
    }

    // 2. Must select exactly maxCourses courses
    if (!empId || !name || selectedCourses.length !== maxCourses) {
      alert(`Error: Please ensure that you have selected ${maxCourses} courses`);
      return;
    }

    // 3. Validate minCount for each allowed domain
    const courseCountsByDomain = selectedCourses.reduce((acc, course) => {
      acc[course.domain] = (acc[course.domain] || 0) + 1;
      return acc;
    }, {});

    let allowedDomains = [];
    if (userDomain === "Common") {
      allowedDomains = ["Common Group 1", "Common Group 2", "Common Group 3"];
    } else {
      allowedDomains = [userDomain, "Common Group 1", "Common Group 2", "Common Group 3"];
    }

    for (const domain of allowedDomains) {
      if (domainConstraints[domain]) {
        const selectedCount = courseCountsByDomain[domain] || 0;
        if (selectedCount < domainConstraints[domain].minCount) {
          alert(
            `You must select at least ${domainConstraints[domain].minCount} courses from the ${domain} domain.`
          );
          return;
        }
      }
    }

    // 4. UG, PG, Research Domain fields required
    if (!pgspecialization || !ugspecialization || !researchDomain) {
      alert("Please fill in the PG, UG, Research Domain details");
      return;
    }

    // 5. Clean courseIds before submit
    const cleanedCourses = Array.isArray(selectedCourses)
      ? selectedCourses.map(course => ({
          ...course,
          courseId: typeof course.courseId === 'string' ? course.courseId.replace(/\s+/g, '').trim() : course.courseId
        }))
      : [];

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/submit-courses`,
        {
          empId,
          name,
          facultyEmail,
          selectedCourses: cleanedCourses,
          draftId,
          willingness,
          preference: 'NA'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/storeugpg`, {
        empId,
        facultyEmail,
        ugspecialization,
        pgspecialization,
        researchDomain,
        draftId,
        preference: 'NA'
      }, { headers: { 'Content-Type': 'application/json' } });
      alert("Courses submitted successfully!");
      handleLogout();
    } catch (error) {
      console.error("Error submitting courses:", error);
      if (error.response && error.response.data && error.response.data.message && error.response.data.message.includes('Registration full')) {
        alert(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.message) {
        alert("Error: " + error.response.data.message);
      } else {
        alert("Error submitting courses. Check console for details.");
      }
    }
  };

  // Helper function to group courses by domain

  // If registration is closed, prevent access
  if (registrationStatus === "CLOSED") {
    return (
      <div className="course-selection-container">
        <h1>Course Selection</h1>
        <div className="registration-closed-alert">
          <h2>⛔ Registration Closed</h2>
          <p>The registration period has ended. No new course submissions are allowed.</p>
          <p>Please navigate to the home page or <button onClick={() => navigate("/")} className="link-button">click here</button> to view your existing registration.</p>
        </div>
      </div>
    );
  }

  return (
      <div className="course-selection-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Course Selection</h1>
        <button className="logout-button" onClick={handleLogout} style={{
          backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer'
        }}>Log Out</button>
      </div>
      <div className="faculty-details">
        <span>Welcome, <strong>{name || "N/A"}</strong></span>
        <span>Employee ID: <strong>{empId || "N/A"}</strong></span>
      </div>
      
      <p style={{ color: "red" }}>
        <strong>Please read the instructions given below before proceeding with the registration process:</strong>
      </p>
      <ol style={{ color: "red", textAlign: "left", fontWeight: "bold", marginLeft: "20px", fontSize: "16px" }}>
        <li>You must select exactly {maxCourses} courses.</li>
        <li>The selected courses will be displayed in the order in which you select them.</li>
        <li>The number in brackets next to the course name is the number of slots available for that course.</li>
      </ol>

      <div className="input-fields">
          <div style={{ display: "flex", width: "100%" }}>
            {/*<label style={{ width: "50%" }}>
              Your UG Degree:
              <input
                type="text"
                value={ug}
                onChange={(e) => setUg(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </label>*/}
            <label style={{ width: "100%" }}>
              UG specialization:
                  <span style={{ color: "red", marginLeft: "4px" }}>*</span>

              <input
                type="text"
                value={ugspecialization}
                onChange={(e) => setUgspecialization(e.target.value)}
                required
                placeholder="B.E CSE/B.E ECE..."
                style={{ width: "100%" }}
              />
            </label>
          </div>
    
          <div style={{ display: "flex", width: "100%" }}>
            {/*<label style={{ width: "50%" }}>
              Your PG Degree:
              <input
                type="text"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </label>*/}
            <label style={{ width: "100%" }}>
              PG specialization:
                  <span style={{ color: "red", marginLeft: "4px" }}>*</span>

              <input
                type="text"
                value={pgspecialization}
                onChange={(e) => setPgspecialization(e.target.value)}
                required
                placeholder="M.E CSE/M.Tech ECE..."
                style={{ width: "100%" }}
              />
            </label>
          </div>
          
          <label style={{ width: "100%" }}>
            Research Domain:
                <span style={{ color: "red", marginLeft: "4px" }}>*</span>

            <input
              type="text"
              value={researchDomain}
              onChange={(e) => setResearchDomain(e.target.value)}
              required
            />
          </label>
        </div> 

      <p className="course-code-info">
        Course Code starts with BCSE - B.Tech Courses<br></br>
        Course Code starts with MCSE - M.Tech Courses<br></br>
        Course Code starts with I/SWE/CSE - Integrated M.Tech Courses<br></br>
        Course Code starts with UCSC - B.Sc Course<br></br></p>
        
      {/*<p style={{textAlign:"center"}}>
        1. If you are more preferred to choose <b>Theory only course</b>, then select <strong>"Theory"</strong> and make your choices appropriately <br></br>
        2. If you are more preferred to choose <b>Lab oriented courses</b>, then select <strong>"Theory+Lab"</strong> and make your choices appropriately </p>
       

      <div style={{width:"100%", display:"flex", gap:"20px" , justifyContent:"center", alignItems: "center"}}>
        <label style={{display:"flex",alignItems:"center",width:"105px"}}>
          <input
            type="radio"
            name="preference"
            value="Theory"
            onChange={(e) => setLocalPreference(e.target.value)}
            required
          />
          Theory
        </label>

        <label style={{display:"flex",alignItems:"center",width:"120px"}}>
          <input
            type="radio"
            name="preference"
            value="Theory+Lab"
            onChange={(e) => setLocalPreference(e.target.value)}
            required
          />
          Theory + Lab
        </label>
      </div> 
      <br></br> */}

      <div className="input-fields" style={{ justifyContent: "center" }}>
        <label style={{ display: "flex", alignItems: "center", fontWeight: 600, fontSize: "16px" }}>
          Willingness to take an extra course
          <span style={{ color: "red", marginLeft: "4px" }}>*</span>
          <div style={{ display: "flex", gap: "15px", marginLeft: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="radio"
                name="willingness"
                value="yes"
                checked={willingness === true}
                onChange={() => setWillingness(true)}
                required
              />
              Yes
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="radio"
                name="willingness"
                value="no"
                checked={willingness === false}
                onChange={() => setWillingness(false)}
                required
              />
              No
            </label>
          </div>
        </label>
      </div>


      <hr />
      
      <div className="selection-view">
        <div className="course-list-main">
          {Array.isArray(courses) && courses.length > 0 ? (
            <div>
              <h2>Theory+Lab Courses</h2>
              <div className="course-list">
                {/* {Object.keys(theoryLabCoursesByDomain).map(domain => (
                  <Accordion key={domain} title={`${domain} (Min: ${domainConstraints[domain]?.minCount || 0}, Max: ${domainConstraints[domain]?.maxCount || 2})`}>
                    {theoryLabCoursesByDomain[domain].map(course => {
                      const regCount = courseRegCounts[course.courseId] || 0;
                      const isFull = course.maxRegistrations > 0 && regCount >= course.maxRegistrations;
                      return (
                        <label key={course.courseId} style={isFull ? { color: '#aaa', textDecoration: 'line-through' } : {}}>
                          <input
                            type="checkbox"
                            checked={selectedCourses.some(c => c.courseId === course.courseId)}
                            onChange={() => handleCourseSelect(course)}
                            disabled={isFull && !selectedCourses.some(c => c.courseId === course.courseId)}
                          />
                          {course.courseName} ({course.courseType}) ({course.courseId})
                          {isFull && !selectedCourses.some(c => c.courseId === course.courseId) && <span style={{color:'red',marginLeft:'5px'}}>(Full)</span>}
                        </label>
                      );
                    })}
                  </Accordion>
                ))} */}

                {/* Theory+Lab */}
{Object.keys(theoryLabCoursesByDomain)
  .filter(domain => {
    if (userDomain === "Common") {
      // Common user: only Common Group 1 and Common Group 2
      return domain === "Common Group 1" || domain === "Common Group 2"|| domain === "Common Group 2";
    } else {
      // Other users: their domain + Common Group 1 + Common Group 2 + Common Group 3
      return (
        domain === userDomain ||
        domain === "Common Group 1" ||
        domain === "Common Group 2" ||
        domain === "Common Group 3"
      );
    }
  })
  .map(domain => (
    <Accordion key={domain} title={`${domain} (Min: ${domainConstraints[domain]?.minCount || 0}, Max: ${domainConstraints[domain]?.maxCount || 7})`}>
      {theoryLabCoursesByDomain[domain].map(course => {
        const regCount = courseRegCounts[course.courseId] || 0;
                      const isFull = course.maxRegistrations > 0 && regCount >= course.maxRegistrations;
                      return (
                        <label key={course.courseId} style={isFull ? { color: '#aaa', textDecoration: 'line-through' } : {}}>
                          <input
                            type="checkbox"
                            checked={selectedCourses.some(c => c.courseId === course.courseId)}
                            onChange={() => handleCourseSelect(course)}
                            disabled={isFull && !selectedCourses.some(c => c.courseId === course.courseId)}
                          />
                          {course.courseName} ({course.courseType}) ({course.courseId})
                          {isFull && !selectedCourses.some(c => c.courseId === course.courseId) && <span style={{color:'red',marginLeft:'5px'}}>(Full)</span>}
                        </label>
                      );
      })}
    </Accordion>
))}
              </div>
      
              <h2>Theory Courses</h2>
              <div className="course-list">
                {/* {Object.keys(theoryCoursesByDomain).map(domain => (
                  <Accordion key={domain} title={`${domain} (Min: ${domainConstraints[domain]?.minCount || 0}, Max: ${domainConstraints[domain]?.maxCount || 2})`}>
                    {theoryCoursesByDomain[domain].map(course => {
                      const regCount = courseRegCounts[course.courseId] || 0;
                      const isFull = course.maxRegistrations > 0 && regCount >= course.maxRegistrations;
                      return (
                        <label key={course.courseId} style={isFull ? { color: '#aaa', textDecoration: 'line-through' } : {}}>
                          <input
                            type="checkbox"
                            checked={selectedCourses.some(c => c.courseId === course.courseId)}
                            onChange={() => handleCourseSelect(course)}
                            disabled={isFull && !selectedCourses.some(c => c.courseId === course.courseId)}
                          />
                          {course.courseName} ({course.courseType}) ({course.courseId})
                          {isFull && !selectedCourses.some(c => c.courseId === course.courseId) && <span style={{color:'red',marginLeft:'5px'}}>(Full)</span>}
                        </label>
                      );
                    })}
                  </Accordion>
                ))}  */}

                {/* Theory */}
{Object.keys(theoryCoursesByDomain)
  .filter(domain => {
    if (userDomain === "Common") {
      // Common user: only Common Group 1 and Common Group 2
      return domain === "Common Group 1" || domain === "Common Group 2";
    } else {
      // Other users: their domain + Common Group 1 + Common Group 2
      return (
        domain === userDomain ||
        domain === "Common Group 1" ||
        domain === "Common Group 2"
      );
    }
  })
  .map(domain => (
    <Accordion key={domain} title={`${domain} (Min: ${domainConstraints[domain]?.minCount || 0}, Max: ${domainConstraints[domain]?.maxCount || 2})`}>
      {theoryCoursesByDomain[domain].map(course => {
        const regCount = courseRegCounts[course.courseId] || 0;
                      const isFull = course.maxRegistrations > 0 && regCount >= course.maxRegistrations;
                      return (
                        <label key={course.courseId} style={isFull ? { color: '#aaa', textDecoration: 'line-through' } : {}}>
                          <input
                            type="checkbox"
                            checked={selectedCourses.some(c => c.courseId === course.courseId)}
                            onChange={() => handleCourseSelect(course)}
                            disabled={isFull && !selectedCourses.some(c => c.courseId === course.courseId)}
                          />
                          {course.courseName} ({course.courseType}) ({course.courseId})
                          {isFull && !selectedCourses.some(c => c.courseId === course.courseId) && <span style={{color:'red',marginLeft:'5px'}}>(Full)</span>}
                        </label>
                      );
      })}
    </Accordion>
))}
              </div>
            </div>
          ) : (
            <p>Loading courses...</p>
          )}
        </div>
        <div className="selected-courses">
          <h2>Selected Courses</h2>
          <ol>
            {selectedCourses.map((course, index) => (
              <li 
                key={course.courseId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={dragOverCourseIndex === index ? 'drag-over' : ''}
              >
                <div className="drag-handle" title="Drag to reorder">⋮⋮</div>
                <div className="course-text-wrapper">
                  <span className="course-index">{index + 1}.</span>
                  <span>
                    {course.courseName}
                    <div className="course-meta">
                      ({course.courseType}) ({course.courseId}) - <strong>{course.domain}</strong>
                    </div>
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <button className="submit-button" onClick={handleSubmit}>Submit Courses</button>
        </div>
      </div>
      

    </div>
  );  
};

export default CourseSelection;
