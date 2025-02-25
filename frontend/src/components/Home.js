import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

const Home = ({ setEmpId, setFacultyEmail, setPreference }) => {
  const [facultyEmail, setLocalFacultyEmail] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");
  const [preference, setLocalPreference] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState(null);
  const navigate = useNavigate();

  // ✅ Function to request OTP
  const sendOtp = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/send-otp`, {
        email: facultyEmail,
      });
      console.log("✅ OTP sent successfully!");
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Try again.");
    }
  };
  

  // ✅ Function to handle OTP verification and registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert("Please verify your email first.");
      return;
    }
  
    try {
      console.log("🔹 Sending OTP for verification:", otp);
      const verifyResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, {
        email: facultyEmail,
        otp: otp, // ✅ Send entered OTP to backend
      });
  
      console.log("✅ OTP Verified:", verifyResponse.data);
  
      // Proceed with faculty check
      const empId = parseInt(empIdInput, 10);
      const response = await axios.get("/faculties.json");
      const faculties = response.data;
      const faculty = faculties.find((fac) => fac.empId === empId && fac.email === facultyEmail);
  
      if (faculty) {
        localStorage.setItem("empId", empId);
        localStorage.setItem("facultyEmail", facultyEmail);
        localStorage.setItem("preference", preference);
  
        const checkResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`
        );
        if (checkResponse.data.exists) {
          alert("You have already registered.");
          return;
        }
  
        navigate("/course-selection", { state: { facultyEmail, empId, preference } });
      } else {
        alert("Wrong Employee ID or Email");
      }
    } catch (error) {
      console.error("❌ OTP Verification Failed:", error.response?.data);
      alert("Invalid OTP. Please try again.");
    }
  };
  
  return (
    <div className="home-container">
      <h4>Backend URL - {process.env.REACT_APP_BACKEND_URL}</h4>
      <h1>Faculty Registration</h1>
      <form onSubmit={handleSubmit} className="home-form">
        {/* Faculty Email Input */}
        <input
          type="email"
          placeholder="Faculty Email ID"
          value={facultyEmail}
          onChange={(e) => setLocalFacultyEmail(e.target.value)}
          required
        />
        
        {/* Send OTP Button */}
        <button type="button" onClick={sendOtp} disabled={otpSent}>
          {otpSent ? "OTP Sent" : "Send OTP"}
        </button>

        {/* Show OTP Input only after OTP is Sent */}
        {otpSent && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        )}

        {/* Show Employee ID & Preference only after OTP is Sent */}
        {otpSent && (
          <>
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
          </>
        )}
      </form>
    </div>
  );
};

export default Home;
