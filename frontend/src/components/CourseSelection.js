import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';  // Import useNavigate
import axios from 'axios';

const CourseSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();  // Initialize useNavigate hook
  const { empId, facultyName, preference } = location.state || {};

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    axios.get('courses.json')
      .then(response => setCourses(response.data))
      .catch(error => console.error("Error fetching courses:", error));
  }, []);

  const maxCourses = empId <= 100 ? 6 : empId <= 200 ? 10 : 15;

  const handleCourseSelect = (course) => {
    setSelectedCourses(prev => {
      if (prev.length >= maxCourses && !prev.some(c => c.courseId === course.courseId)) {
        alert(`You can only select exactly ${maxCourses} courses.`);
        return prev;
      }

      const domainCount = prev.filter(c => c.domain === course.domain).length;
      if (domainCount >= 2 && !prev.some(c => c.courseId === course.courseId)) {
        alert(`You can only select up to 2 courses from the ${course.domain} domain.`);
        return prev;
      }

      if (prev.some(c => c.courseId === course.courseId)) {
        return prev.filter(c => c.courseId !== course.courseId);
      }
      return [...prev, course];
    });
  };

  const handleSubmit = async () => {
    if (!empId) {
      alert("Error: Employee ID is missing!");
      return;
    }

    if (!facultyName) {
      alert("Error: Faculty name is missing!");
      return;
    }

    if (selectedCourses.length !== maxCourses) {
      alert(`You must select exactly ${maxCourses} courses.`);
      return;
    }

    const theoryCount = selectedCourses.filter(c => c.type === "Theory").length;
    const theoryLabCount = selectedCourses.filter(c => c.type === "Theory+Lab").length;

    const minTheory = empId <= 100 ? 4 : empId <= 200 ? 8 : 10;
    const minTheoryLab = empId <= 100 ? 4 : empId <= 200 ? 8 : 10;

    if (preference === "Theory" && theoryCount < minTheory) {
      alert(`You must select at least ${minTheory} Theory courses.`);
      return;
    }
    if (preference === "Theory+Lab" && theoryLabCount < minTheoryLab) {
      alert(`You must select at least ${minTheoryLab} Theory+Lab courses.`);
      return;
    }

    try {
      await axios.post('http://localhost:5000/faculty/submit-courses', 
        { empId, facultyName, preference, selectedCourses },
        { headers: { 'Content-Type': 'application/json' } }
      );
      alert("Courses submitted successfully!");
      navigate('/');  // Redirect to homepage after successful submission
    } catch (error) {
      console.error("Error submitting courses:", error);
      alert("Error submitting courses. Check console for details.");
    }
  };

  // Helper function to group courses by domain
  const groupByDomain = (courses) => {
    return courses.reduce((acc, course) => {
      if (!acc[course.domain]) {
        acc[course.domain] = [];
      }
      acc[course.domain].push(course);
      return acc;
    }, {});
  };

  // Grouping courses by their domain type
  const theoryCoursesByDomain = groupByDomain(courses.filter(course => course.type === "Theory"));
  const theoryLabCoursesByDomain = groupByDomain(courses.filter(course => course.type === "Theory+Lab"));

  return (
    <div>
      <h1>Course Selection</h1>
      <p>Faculty Name: <strong>{facultyName || "N/A"}</strong></p>
      <p>Preference: <strong>{preference || "N/A"}</strong></p>
      <p>Employee ID: <strong>{empId || "N/A"}</strong></p>
      <p><strong>You must select exactly {maxCourses} courses.</strong></p>

      <div>
        <h2>Selected Courses</h2>
        <ol>
          {selectedCourses.map(course => (
            <li key={course.courseId}>
              {course.courseName} ({course.type}) ({course.courseId}) - <strong>{course.domain}</strong>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h2>Theory Courses</h2>
        {Object.keys(theoryCoursesByDomain).map(domain => (
          <div key={domain}>
            <h3>{domain}</h3>
            {theoryCoursesByDomain[domain].map(course => (
              <label key={course.courseId} style={{ display: "block", marginBottom: "5px" }}>
                <input
                  type="checkbox"
                  checked={selectedCourses.some(c => c.courseId === course.courseId)}
                  onChange={() => handleCourseSelect(course)}
                />
                {course.courseName} ({course.type}) ({course.courseId}) - <strong>{course.domain}</strong>
              </label>
            ))}
          </div>
        ))}

        <h2>Theory+Lab Courses</h2>
        {Object.keys(theoryLabCoursesByDomain).map(domain => (
          <div key={domain}>
            <h3>{domain}</h3>
            {theoryLabCoursesByDomain[domain].map(course => (
              <label key={course.courseId} style={{ display: "block", marginBottom: "5px" }}>
                <input
                  type="checkbox"
                  checked={selectedCourses.some(c => c.courseId === course.courseId)}
                  onChange={() => handleCourseSelect(course)}
                />
                {course.courseName} ({course.type}) ({course.courseId}) - <strong>{course.domain}</strong>
              </label>
            ))}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit}>Submit Courses</button>
    </div>
  );
};

export default CourseSelection;
