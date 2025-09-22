import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

const Home = ({ setEmpId, setFacultyEmail, setPreference }) => {
  const [facultyEmpid, setLocalFacultyEmpid] = useState("");
  const [facultyEmail, setLocalFacultyEmail] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [registrationStatus, setRegistrationStatus] = useState("Loading");

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/registration-status`)
      .then(response => {
        setRegistrationStatus(response.data.status);
      })
      .catch(error => console.error("Error fetching registration status:", error));
  }, []);

  const sendOtp = async () => {
    setLoading(true);
    const empId = facultyEmpid;
    const response = await axios.get("/faculties.json");
    const faculties = response.data;
    const faculty = faculties.find((fac) => fac.empId == facultyEmpid);

    if (!faculty) {
      alert("Faculty not found. Please check the Employee ID.");
      setLoading(false);
      return;
    }
    const facultyEmail = faculty.email;
    setLocalFacultyEmail(facultyEmail);

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${facultyEmpid}`);
      if (response.data.exists) {
        alert("You have already registered.");
        navigate(`/faculty/${empId}`);
        return;
      }
    } catch (error) {
      console.error("Error Checking DB:", error);
      alert("Failed to check DB. Try again.");
    } finally {
      setLoading(false);
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/send-otp`, {
        email: facultyEmail,
      });
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert("Please verify your email first.");
      return;
    }

    try {
      const verifyResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, {
        email: facultyEmail,
        otp: otp,
      });

      const empId = facultyEmpid;

      if (facultyEmail && facultyEmpid) {
        localStorage.setItem("empId", empId);
        localStorage.setItem("facultyEmail", facultyEmail);

        const checkResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`
        );
        if (checkResponse.data.exists) {
          alert("You have already registered.");
          return;
        }

        navigate("/course-selection", { state: { facultyEmail, empId } });
      } else {
        alert("Wrong Employee ID or Email");
      }
    } catch (error) {
      console.error("❌ OTP Verification Failed:", error.response?.data);
      alert("Invalid OTP. Please try again.");
    }
  };

  // Loading state
  if (registrationStatus === "Loading") {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading registration status...</p>
        </div>
      </div>
    );
  }

  // Registration closed state
  if (registrationStatus !== "OPEN") {
    return (
      <div className="home-container">
        <h1>Faculty Registration</h1>
        <div className="registration-closed">
          <h2>Registration Closed</h2>
          <p>The registration period has ended. Please contact the administrator for assistance.</p>
        </div>
      </div>
    );
  }

  // Main registration form
  return (
    <div className="home-container">
      <h1>Faculty Registration</h1>
      
      <form onSubmit={handleSubmit} className="home-form">
        <input
          type="number"
          placeholder="Enter Faculty Employee ID"
          value={facultyEmpid}
          onChange={(e) => setLocalFacultyEmpid(e.target.value)}
          required
        />
        
        {!otpSent && (
          <button type="button" onClick={sendOtp} disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP to Email"}
          </button>
        )}

        {otpSent && (
          <>
            <p>✓ OTP has been sent to your registered email address</p>
            
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              required
            />
            
            <button type="submit">
              Verify & Continue
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Home;
