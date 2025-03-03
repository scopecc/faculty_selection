import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseSelection.css';

const CourseSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from location state or fallback to localStorage
  const storedEmpId = localStorage.getItem('empId');
  const storedFacultyEmail = localStorage.getItem('facultyEmail');
  const storedPreference = localStorage.getItem('preference');

  const empId = location.state?.empId || storedEmpId;
  const facultyEmail = location.state?.facultyEmail || storedFacultyEmail;
  const preference = location.state?.preference || storedPreference;

  const [facultyName, setFacultyName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  const [ug, setUg] = useState('');
  const [ugspecialization, setUgspecialization] = useState('');
  const [pg, setPg] = useState('');
  const [pgspecialization, setPgspecialization] = useState('');
  const [researchDomain, setResearchDomain] = useState('');
  const [domainConstraints, setDomainConstraints] = useState({});

  // Fetch faculty name based on email
  useEffect(() => {
    if (facultyEmail) {
      axios.get('faculties.json')
        .then(response => {
          const faculty = response.data.find(fac => fac.email === facultyEmail);
          if (faculty) {
            setFacultyName(faculty.name);
          } else {
            setFacultyName('Unknown Faculty');
          }
        })
        .catch(error => console.error("Error fetching faculty data:", error));
    }
  }, [facultyEmail]);


const [theoryCoursesByDomain, setTheoryCoursesByDomain] = useState({});
const [theoryLabCoursesByDomain, setTheoryLabCoursesByDomain] = useState({});
const [courses, setCourses] = useState([]);
const [isCoursesFetched, setIsCoursesFetched] = useState(false);

// Fetch course data
useEffect(() => {
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        const updatedCourses = response.data.map(course => ({
          ...course,
          courseType: course.courseType?.trim().toLowerCase() || "undefined", // ✅ Normalize
        }));
        setCourses(updatedCourses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses from MongoDB:", error);
      setCourses([]);
    }
  };

  fetchCourses();
}, []);


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
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/domain-config`)
      .then(response => {
        const constraints = response.data.reduce((acc, config) => {
          acc[config.domain] = { minCount: config.minCount, maxCount: config.maxCount };
          return acc;
        }, {});
        setDomainConstraints(constraints);
      })
      .catch(error => console.error("Error fetching domain constraints:", error));
  }, []);

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
    if (!empId || !facultyName || selectedCourses.length !== maxCourses) {
      alert("Error: Please ensure all selections are valid.");
      return;
    }

    const theoryCount = selectedCourses.filter(c => c.courseType === "theory").length;
    const theoryLabCount = selectedCourses.filter(c => c.courseType === "theory+lab").length;

    if (preference === "Theory" && theoryCount < 5) {
      alert(`You must select at least 5 Theory courses.`);
      return;
    }
    if (preference === "Theory+Lab" && theoryLabCount < 5) {
      alert(`You must select at least 5 Theory+Lab courses.`);
      return;
    }

    const courseCountsByDomain = selectedCourses.reduce((acc, course) => {
      acc[course.domain] = (acc[course.domain] || 0) + 1;
      return acc;
    }, {});

    for (const domain in domainConstraints) {
      const selectedCount = courseCountsByDomain[domain] || 0;
      if (selectedCount < domainConstraints[domain].minCount) {
        alert(`You must select at least ${domainConstraints[domain].minCount} courses from the ${domain} domain.`);
        return;
      }
    }

    if(!pg || !pgspecialization || !ug || !ugspecialization || !researchDomain){
      alert("Please fill all the fields");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/submit-courses`, 
        { empId, facultyName, facultyEmail, preference, selectedCourses },
        { headers: { 'Content-Type': 'application/json' } }
      );
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/storeugpg`,{
        empId, ug, ugspecialization, pg, pgspecialization, researchDomain
      },{ headers: { 'Content-Type': 'application/json' } })
      alert("Courses submitted successfully!");
       navigate('/');
    } catch (error) {
      console.error("Error submitting courses:", error);
      alert("Error submitting courses. Check console for details.");
    }
  };

  // Helper function to group courses by domain

  
  // Grouping courses

  

  

  return (
    <div className="course-selection-container">
      <h1>Course Selection</h1>
      <p className="faculty-details">Faculty Name: <strong>{facultyName || "N/A"}</strong></p>
      <p className="faculty-details">Preference: <strong>{preference || "N/A"}</strong></p>
      <p className="faculty-details">Employee ID: <strong>{empId || "N/A"}</strong></p>
      <p><strong>You must select exactly {maxCourses} courses.</strong></p>
  
      <div className="input-fields">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <label>
            UG:
            <input
              type="text"
              value={ug}
              onChange={(e) => setUg(e.target.value)}
              required
            />
          </label>
          <label>
            UG specialization:
            <input
              type="text"
              value={ugspecialization}
              onChange={(e) => setUgspecialization(e.target.value)}
              required
            />
          </label>
        </div>
  
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <label>
            PG:
            <input
              type="text"
              value={pg}
              onChange={(e) => setPg(e.target.value)}
              required
            />
          </label>
          <label>
            PG specialization:
            <input
              type="text"
              value={pgspecialization}
              onChange={(e) => setPgspecialization(e.target.value)}
              required
            />
          </label>
        </div>
        
        <label>
          Research Domain:
          <input
            type="text"
            value={researchDomain}
            onChange={(e) => setResearchDomain(e.target.value)}
            required
          />
        </label>
      </div>
  
      {Array.isArray(courses) && courses.length > 0 ? (
        <>
          <div className="selected-courses">
            <h2>Selected Courses</h2>
            <ol>
              {selectedCourses.map(course => (
                <li key={course.courseId}>
                  {course.courseName} ({course.courseType}) ({course.courseId}) - <strong>{course.domain}</strong>
                </li>
              ))}
            </ol>
          </div>
  
          <h2>Theory Courses</h2>
          <div className="course-list">
            {Object.keys(theoryCoursesByDomain).map(domain => (
              <div key={domain}>
                <h3>{domain} (Min: {domainConstraints[domain]?.minCount || 0}, Max: {domainConstraints[domain]?.maxCount || 2})</h3>
                {theoryCoursesByDomain[domain].map(course => (
                  <label key={course.courseId}>
                    <input
                      type="checkbox"
                      checked={selectedCourses.some(c => c.courseId === course.courseId)}
                      onChange={() => handleCourseSelect(course)}
                    />
                    {course.courseName} ({course.courseType}) ({course.courseId})
                  </label>
                ))}
              </div>
            ))}
          </div>
  
          <h2>Theory+Lab Courses</h2>
          <div className="course-list">
            {Object.keys(theoryLabCoursesByDomain).map(domain => (
              <div key={domain}>
                <h3>{domain} (Min: {domainConstraints[domain]?.minCount || 0}, Max: {domainConstraints[domain]?.maxCount || 2})</h3>
                {theoryLabCoursesByDomain[domain].map(course => (
                  <label key={course.courseId}>
                    <input
                      type="checkbox"
                      checked={selectedCourses.some(c => c.courseId === course.courseId)}
                      onChange={() => handleCourseSelect(course)}
                    />
                    {course.courseName} ({course.courseType}) ({course.courseId})
                  </label>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Loading courses...</p>
      )}
      
      <button className="submit-button" onClick={handleSubmit}>Submit Courses</button>
    </div>
  );
  
};

export default CourseSelection;