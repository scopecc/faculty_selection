import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = ({ setEmpId, setFacultyName, setPreference }) => {
  const [facultyName, setLocalFacultyName] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [preference, setLocalPreference] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empId = parseInt(empIdInput, 10);

    if (empId < 1 || empId > 308) {
      alert("Employee ID must be between 1 and 308.");
      return;
    }

    try {
      // ✅ Check if faculty already exists
      const response = await axios.get(`http://localhost:5000/faculty/check/${empId}`);
      if (response.data.exists) {
        alert("You have already registered and selected courses.");
        return;
      }

      // ✅ Save global state
      setEmpId(empId);
      setFacultyName(facultyName);
      setPreference(preference);

      // ✅ Navigate to course selection and pass data
      navigate('/course-selection', { state: { facultyName, empId, preference } });

    } catch (error) {
      console.error("Error checking empId:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h1>Faculty Registration</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Faculty Name"
          value={facultyName}
          onChange={(e) => setLocalFacultyName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Employee ID"
          value={empIdInput}
          onChange={(e) => setEmpIdInput(e.target.value)}
          required
        />

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

        <button type="submit">Next</button>
      </form>
    </div>
  );
};

export default Home;
