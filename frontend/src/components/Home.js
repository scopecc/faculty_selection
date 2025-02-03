import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = ({ setEmpId }) => {
  const [name, setName] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [preference, setPreference] = useState('Theory');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empId = parseInt(empIdInput, 10);

    // ✅ Validate empId Range (1 to 308)
    if (empId < 1 || empId > 308) {
      alert("Employee ID must be between 1 and 308.");
      return;
    }

    try {
      // ✅ Check if empId already exists in the database
      const response = await axios.get(`http://localhost:5000/faculty/check/${empId}`);
      
      if (response.data.exists) {
        alert("You have already registered and selected courses.");
        return;
      }

      // ✅ Store empId globally and proceed with registration
      setEmpId(empId);
      await axios.post('http://localhost:5000/faculty/register', { name, empId, preference });
      navigate('/course-selection');
      
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
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="number" 
          placeholder="Employee ID" 
          value={empIdInput} 
          onChange={(e) => setEmpIdInput(e.target.value)} 
          required 
        />
        <button type="button" onClick={() => setPreference('Theory')}>Theory</button>
        <button type="button" onClick={() => setPreference('Theory+Lab')}>Theory+Lab</button>
        <button type="submit">Next</button>
      </form>
    </div>
  );
};

export default Home;
