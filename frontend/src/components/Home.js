import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css'; // Import the CSS file

const Home = ({ setEmpId, setFacultyEmail, setPreference }) => {
  const [facultyEmail, setLocalFacultyEmail] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [preference, setLocalPreference] = useState('');
  const navigate = useNavigate();

  // const handleSubmit = async (e) => {
  //   console.log("Backend URL - ", process.env.REACT_APP_BACKEND_URL);
  //   console.log("Data", facultyEmail, empIdInput, preference);
  //   e.preventDefault();
  //   const empId = parseInt(empIdInput, 10);

  //   if (empId < 1 || empId > 308) {
  //     alert("Employee ID must be between 1 and 308.");
  //     return;
  //   }

    // try {
    //   // ✅ Check if faculty already exists
    //   const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`);
    //   if (response.data.exists) {
    //     alert("You have already registered and selected courses.");
    //     return;
    //   }

    //   // ✅ Save global state
    //   setEmpId(empId);
    //   setFacultyEmail(facultyEmail);
    //   setPreference(preference);

    //   // ✅ Navigate to course selection and pass data
    //   navigate('/course-selection', { state: { facultyEmail, empId, preference } });

    // } catch (error) {
    //   console.error("Error checking empId:", error);
    //   alert("An error occurred. Please try again.");
    // }
  // };

  const handleSubmit = async (e) => {
    console.log(facultyEmail, empIdInput, preference);
      e.preventDefault();
      const empId = parseInt(empIdInput, 10);
      // if (empId < 1 || empId > 308) {
      //   alert("Employee ID must be between 1 and 308.");
      //   return;
      // }
      try {
        const response = await axios.get('/faculties.json');
        const faculties = response.data;
        const faculty = faculties.find(fac => fac.empId === empId && fac.email === facultyEmail);
        if (faculty) {
          console.log("Success");
          // Save to local storage
          localStorage.setItem('empId', empId);
          localStorage.setItem('facultyEmail', facultyEmail);
          localStorage.setItem('preference', preference);

          // ✅ Check if faculty already exists
          const checkResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`);
          if (checkResponse.data.exists) {
        alert("You have already registered and selected courses.");
        return;
          }
          // ✅ Navigate to course selection and pass data
          navigate('/course-selection', { state: { facultyEmail, empId, preference } });
        } else {
          console.log("Failure");
          alert("Wrong empId or email");
        }
      } catch (error) {
        console.error("Error checking faculty:", error);
        alert("An error occurred. Please try again.");
      }
  }

  return (
    <div className="home-container">
      <h4>Backend URL - {process.env.REACT_APP_BACKEND_URL}</h4>
      <h1>Faculty Registration</h1>
      <form onSubmit={handleSubmit} className="home-form">
        <input
          type="email"
          placeholder="Faculty Email ID"
          value={facultyEmail}
          onChange={(e) => setLocalFacultyEmail(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Employee ID"
          value={empIdInput}
          onChange={(e) => setEmpIdInput(e.target.value)}
          required
        />

        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="preference"
              value="Theory"
              onChange={(e) => setLocalPreference(e.target.value)}
              required
            />
            Theory
          </label>

          <label>
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

        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default Home;