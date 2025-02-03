import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseSelection = ({ empId }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [domainCount, setDomainCount] = useState({});

  useEffect(() => {
    axios.get('/courses.json')
      .then(response => setCourses(response.data))
      .catch(error => console.error('Error loading courses:', error));
  }, []);
  console.log(empId);
  const getMaxCourses = (empId) => {
    if (empId >= 0 && empId <= 100) return 6;
    if (empId >= 101 && empId <= 200) return 10;
    if (empId >= 201 && empId <= 308) return 15;
    
  };

  const maxCourses = getMaxCourses(empId);

  const handleSelect = (course) => {
    const updatedCourses = selectedCourses.includes(course)
      ? selectedCourses.filter(c => c !== course)
      : [...selectedCourses, course];
    
    const domainCountCopy = { ...domainCount };
    domainCountCopy[course.domain] = (domainCountCopy[course.domain] || 0) + (selectedCourses.includes(course) ? -1 : 1);
    
    if (domainCountCopy[course.domain] > 2) {
      alert(`You can only select 2 courses from ${course.domain}`);
      return;
    }
    
    if (updatedCourses.length > maxCourses) {
      alert(`You must select exactly ${maxCourses} courses`);
      return;
    }
    
    setSelectedCourses(updatedCourses);
    setDomainCount(domainCountCopy);
  };

  const handleSubmit = () => {
    console.log("Submitting courses:", { empId, selectedCourses }); // Debug log
  
    if (!empId) {
      console.error("Error: empId is null or undefined!");
      alert("Error: Employee ID is missing. Please try again.");
      return;
    }
  
    if (selectedCourses.length !== maxCourses) {
      alert(`You must select exactly ${maxCourses} courses`);
      return;
    }
  
    axios.post('http://localhost:5000/faculty/submit-courses', { empId, selectedCourses })
      .then(response => {
        console.log("Response from server:", response.data);
        alert('Courses submitted successfully!');
      })
      .catch(error => {
        console.error('Error submitting courses:', error);
        alert("Error submitting courses. Check console for details.");
      });
  };
  
  

  return (
    <div>
      <h1>Course Selection</h1>
      <h2>Selected Courses</h2>
      <ul>
        {selectedCourses.map(course => (
          <li key={course.courseId}>{course.courseName} ({course.domain})</li>
        ))}
      </ul>
      
      <h2>Theory Courses</h2>
      <ul>
        {courses.filter(course => course.type === 'Theory').map(course => (
          <li key={course.courseId}>
            <input type="checkbox" checked={selectedCourses.includes(course)} onChange={() => handleSelect(course)} />
            {course.courseName} ({course.domain})
          </li>
        ))}
      </ul>
      
      <h2>Theory + Lab Courses</h2>
      <ul>
        {courses.filter(course => course.type === 'Theory+Lab').map(course => (
          <li key={course.courseId}>
            <input type="checkbox" checked={selectedCourses.includes(course)} onChange={() => handleSelect(course)} />
            {course.courseName} ({course.domain})
          </li>
        ))}
      </ul>
      
      <button onClick={handleSubmit}>Submit Courses</button>
    </div>
  );
};

export default CourseSelection;