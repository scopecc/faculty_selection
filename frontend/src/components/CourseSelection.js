import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseSelection.css';

const CourseSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const storedEmpId = localStorage.getItem('empId');
  const storedFacultyEmail = localStorage.getItem('facultyEmail');
  const storedPreference = localStorage.getItem('preference');

  const empId = location.state?.empId || storedEmpId;
  const facultyEmail = location.state?.facultyEmail || storedFacultyEmail;
  const preference = location.state?.preference || storedPreference;

  const [facultyName, setFacultyName] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [domainConstraints, setDomainConstraints] = useState({});

  const maxCourses = 7;

  useEffect(() => {
    if (facultyEmail) {
      axios.get('faculties.json')
        .then(response => {
          const faculty = response.data.find(fac => fac.email === facultyEmail);
          setFacultyName(faculty ? faculty.name : 'Unknown Faculty');
        })
        .catch(error => console.error("Error fetching faculty data:", error));
    }
  }, [facultyEmail]);

  useEffect(() => {
    axios.get('courses.json')
      .then(response => setCourses(response.data))
      .catch(error => console.error("Error fetching courses:", error));
  }, []);

  // Fetch domain constraints from MongoDB
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

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/faculty/submit-courses`, 
        { empId, facultyName, facultyEmail, preference, selectedCourses },
        { headers: { 'Content-Type': 'application/json' } }
      );
      alert("Courses submitted successfully!");
      navigate('/');
    } catch (error) {
      console.error("Error submitting courses:", error);
      alert("Error submitting courses. Check console for details.");
    }
  };

  const groupByDomain = (courses) => {
    return courses.reduce((acc, course) => {
      acc[course.domain] = acc[course.domain] || [];
      acc[course.domain].push(course);
      return acc;
    }, {});
  };

  const theoryCoursesByDomain = groupByDomain(courses.filter(course => course.type === "Theory"));
  const theoryLabCoursesByDomain = groupByDomain(courses.filter(course => course.type === "Theory+Lab"));

  return (
    <div className="course-selection-container">
      <h1>Course Selection</h1>
      <p><strong>You must select exactly {maxCourses} courses.</strong></p>

      <div className="selected-courses">
        <h2>Selected Courses</h2>
        <ol>
          {selectedCourses.map(course => (
            <li key={course.courseId}>
              {course.courseName} ({course.type}) ({course.courseId}) - <strong>{course.domain}</strong>
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
                {course.courseName} ({course.type}) ({course.courseId})
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
                {course.courseName} ({course.type}) ({course.courseId})
              </label>
            ))}
          </div>
        ))}
      </div>

      <button className="submit-button" onClick={handleSubmit}>Submit Courses</button>
    </div>
  );
};

export default CourseSelection;
