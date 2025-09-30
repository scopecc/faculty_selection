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
  const storedEmpId = localStorage.getItem('empId');
  const storedFacultyEmail = localStorage.getItem('facultyEmail');
  //const storedPreference = localStorage.getItem('preference');
  const storedDraftId = localStorage.getItem('draftId');

  const empId = location.state?.empId || storedEmpId;
  const facultyEmail = location.state?.facultyEmail || storedFacultyEmail;
  const draftId = location.state?.draftId || storedDraftId || null;

  const [name, setName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  //const [ug, setUg] = useState('');
  const [ugspecialization, setUgspecialization] = useState('');
  //const [pg, setPg] = useState('');
  const [pgspecialization, setPgspecialization] = useState('');
  const [researchDomain, setResearchDomain] = useState('');
  const [domainConstraints, setDomainConstraints] = useState({});

  //const [preference, setLocalPreference] = useState("");
  const [willingness, setWillingness] = useState(null); // New state for willingness

  const moveCourseUp = (index) => {
    if (index === 0) return;
    const updatedCourses = [...selectedCourses];
    [updatedCourses[index - 1], updatedCourses[index]] = [updatedCourses[index], updatedCourses[index - 1]];
    setSelectedCourses(updatedCourses);
  };

  const [userDomain, setUserDomain] = useState(null); // ← new state

useEffect(() => {
  if (facultyEmail) {
    axios.get('faculties.json')
      .then(response => {
        const faculty = response.data.find(fac => fac.email === facultyEmail);
        if (faculty) {
          setName(faculty.name);
          setUserDomain(faculty.domain || null); // <-- store mapped domain
        } else {
          setName('Unknown Faculty');
          setUserDomain(null);
        }
      })
      .catch(error => console.error("Error fetching faculty data:", error));
  }
}, [facultyEmail]);

  
  const moveCourseDown = (index) => {
    if (index === selectedCourses.length - 1) return;
    const updatedCourses = [...selectedCourses];
    [updatedCourses[index + 1], updatedCourses[index]] = [updatedCourses[index], updatedCourses[index + 1]];
    setSelectedCourses(updatedCourses);
  };

  //useEffect(()=>{
    //localStorage.setItem("preference",preference)
  //},[preference])
  // Fetch faculty name based on email
  useEffect(() => {
    if (facultyEmail) {
      axios.get('faculties.json')
        .then(response => {
          const faculty = response.data.find(fac => fac.email === facultyEmail);
          if (faculty) {
            setName(faculty.name);
          } else {
            setName('Unknown Faculty');
          }
        })
        .catch(error => console.error("Error fetching faculty data:", error));
    }
  }, [facultyEmail]);


const [theoryCoursesByDomain, setTheoryCoursesByDomain] = useState({});
const [theoryLabCoursesByDomain, setTheoryLabCoursesByDomain] = useState({});
const [courses, setCourses] = useState([]);
const [isCoursesFetched, setIsCoursesFetched] = useState(false);
const [courseRegCounts, setCourseRegCounts] = useState({});

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
  // Debug: log all relevant values before submission
  console.log('DEBUG SUBMIT: empId:', empId);
  console.log('DEBUG SUBMIT: name:', name);
  console.log('DEBUG SUBMIT: selectedCourses:', selectedCourses);
  console.log('DEBUG SUBMIT: draftId:', draftId);
  console.log('DEBUG SUBMIT: willingness:', willingness);
  // Debug log to check values before submission
  console.log('Submitting:', { empId, name, selectedCourses, draftId, willingness });

  // Fallbacks to ensure required fields are always sent
  const safeEmpId = empId || localStorage.getItem('empId') || 'unknown_empid';
  const safeName = name || 'Unknown Faculty';
  const safeDraftId = draftId || localStorage.getItem('draftId') || 'unknown_draftid';
  const safeWillingness = willingness === null ? false : willingness;
  const safeFacultyEmail = facultyEmail || localStorage.getItem('facultyEmail') || 'unknown_email';
  const cleanedCourses = Array.isArray(selectedCourses) ? selectedCourses.map(course => ({
    ...course,
    courseId: typeof course.courseId === 'string' ? course.courseId.replace(/\s+/g, '').trim() : course.courseId
  })) : [];

  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/submit-courses`,
      {
        empId: safeEmpId,
        name: safeName,
        facultyEmail: safeFacultyEmail,
        selectedCourses: cleanedCourses,
        draftId: safeDraftId,
        willingness: safeWillingness
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/storeugpg`, {
      empId: safeEmpId,
      facultyEmail: safeFacultyEmail,
      ugspecialization,
      pgspecialization,
      researchDomain,
      draftId: safeDraftId
    }, { headers: { 'Content-Type': 'application/json' } });
    alert("Courses submitted successfully!");
    navigate('/');
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

  return (
    <div className="course-selection-container">
      <h1>Course Selection</h1>
  <p className="faculty-details" style={{fontSize:"45px"}}>Welcome, <strong style={{fontSize:"45px"}}>{name || "N/A"}</strong></p>
      {/*<p className="faculty-details">Preference: <strong>{preference || "N/A"}</strong></p>*/}
      <p className="faculty-details">Employee ID: <strong>{empId || "N/A"}</strong></p>
      <p className="faculty-details" style={{ color: "red" }}>
  <strong>
    Please read the instructions given below before proceeding with the registration process:
  </strong>
</p>
<ol
  style={{
    color: "red",
    textAlign: "left",
    fontWeight: "bold",
    marginLeft: "20px",
    fontSize: "16px",
  }}
>
  <li>You must select exactly {maxCourses} courses.</li>
  <li>The selected courses will be displayed in the order in which you select them.</li>
  {/*<li>
    If you prefer Theory-only courses, choose 5 Theory-only courses and 2
    Theory+Lab courses.
  </li>
  <li>
    If you prefer Lab-oriented courses, choose at least 5 Theory+Lab courses.
  </li>*/}
  <li>
    The number in brackets next to the course name is the number of slots
    available for that course.
  </li>
</ol>

      <div style={{margin:"auto", textAlign:"center"}}>
        <div className="input-fields" style={{ padding: "20px", display:"flex"}}>
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
              style={{ width: "100%" }}
            />
          </label>
        </div> 
      </div>

      <p style={{textAlign:"center",color:"blue"}}>
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

      <div style={{ width: "100%", display: "flex", gap: "20px", justifyContent: "center", alignItems: "center" }}>
        {/* Willingness Radio */}
        <label style={{ display: "flex", alignItems: "center", marginLeft: "30px", fontWeight: 600, fontSize: "16px" }}>
          Willingness to take an extra course
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>

          <div style={{ marginLeft: "15px", display: "flex", gap: "15px" }}>
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
  
      <div className="selection-view" style={{display:"flex", gap:"30px"}}>
        <div style={{width:"60%"}}>
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
        <div style={{width:"40%",position:"sticky",top:"30px",backgroundColor:"#D2E3FC",padding:"30px"}} className="selected-courses">
          <div style={{display:"flex",minHeight:"70vh",flexDirection:"column",justifyContent:"space-between",alignItems:"between"}}>
            <div>
              <h2>Selected Courses</h2>
              <ol>
                {selectedCourses.map((course,index) => (
                  <li 
                  key={course.courseId} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    background: "#f5f5f5", 
                    padding: "10px", 
                    marginBottom: "10px", 
                    borderRadius: "5px" 
                  }}
                >
                  <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "500"}}>{index + 1})&nbsp;&nbsp;
          {course.courseName} ({course.courseType}) ({course.courseId}) - <strong>{course.domain}</strong>
        </div>
                  </div>
                  <span style={{ display: "flex" }}>
                    <button 
                      onClick={() => moveCourseUp(index)} 
                      title="Move Up"
                      className="move-button"
                    >
                      ⬆️
                    </button>
                    <button 
                      onClick={() => moveCourseDown(index)} 
                      title="Move Down"
                      className="move-button"
                    >
                      ⬇️
                    </button>
                  </span>
                </li>
              ))}
              </ol>
            </div>
            <div style={{ textAlign: "center" }}>
              <button className="submit-button" onClick={handleSubmit}>Submit Courses</button>
            </div>  
          </div>
        </div>
      </div>
      

    </div>
  );  
};

export default CourseSelection;
