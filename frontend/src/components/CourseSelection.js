import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';  // ✅ Import `useLocation`
import axios from 'axios';

const CourseSelection = () => {
  const location = useLocation();  // ✅ Extract passed data
  const { empId, facultyName, preference } = location.state || {};  // ✅ Retrieve values safely

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    // ✅ Fetch courses from backend (or local JSON file)
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
    } catch (error) {
      console.error("Error submitting courses:", error);
      alert("Error submitting courses. Check console for details.");
    }
  };

  return (
    <div>
      <h1>Course Selection</h1>
      <p>Faculty Name: <strong>{facultyName || "N/A"}</strong></p>  {/* ✅ Prevents undefined issue */}
      <p>Preference: <strong>{preference || "N/A"}</strong></p>
      <p>Employee ID: <strong>{empId || "N/A"}</strong></p>
      <p><strong>You must select exactly {maxCourses} courses.</strong></p>

      <div>
        <h2>Theory Courses</h2>
        {courses
          .filter(course => course.type === "Theory")
          .map(course => (
            <label key={course.courseId} style={{ display: "block", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={selectedCourses.some(c => c.courseId === course.courseId)}
                onChange={() => handleCourseSelect(course)}
              />
              {course.courseName} ({course.type}) - <strong>{course.domain}</strong>
            </label>
        ))}

        <h2>Theory+Lab Courses</h2>
        {courses
          .filter(course => course.type === "Theory+Lab")
          .map(course => (
            <label key={course.courseId} style={{ display: "block", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={selectedCourses.some(c => c.courseId === course.courseId)}
                onChange={() => handleCourseSelect(course)}
              />
              {course.courseName} ({course.type}) - <strong>{course.domain}</strong>
            </label>
        ))}
      </div>

      <button onClick={handleSubmit}>Submit Courses</button>
    </div>
  );
};

export default CourseSelection;
