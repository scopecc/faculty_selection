import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './FacultyDetails.css';

const FacultyDetails = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    const fetchFacultyEmail = async () => {
      try {
        const response = await axios.get('/faculties.json');
        const faculties = response.data;
        const fac = faculties.find(f => String(f.empId) === String(empId));
        if (fac) {
          setFacultyEmail(fac.email);
        }
      } catch (error) {
        setFacultyEmail("");
      }
    };
    fetchFacultyEmail();
  }, [empId]);

  const sendOtp = async () => {
    if (!facultyEmail) {
      alert("Faculty email not found. Cannot send OTP.");
      return;
    }
    setSendingOtp(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/send-otp`, { email: facultyEmail });
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (error) {
      alert("Failed to send OTP. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, { email: facultyEmail, otp });
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`);
      if (response.data.exists) {
        setFaculty(response.data.faculty);
        setOtpVerified(true);
      } else {
        alert("Faculty not found!");
        navigate("/home");
      }
    } catch (error) {
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!otpVerified) {
      alert("Please verify OTP first.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this faculty record?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/faculty/delete/${empId}`);
        alert("Faculty record deleted successfully.");
        navigate("/home");
      } catch (error) {
        console.error("Error deleting faculty:", error);
        alert("Error deleting faculty.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="faculty-details-print">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading faculty details...</p>
        </div>
      </div>
    );
  }

  // OTP verification screen
  if (!otpVerified) {
    return (
      <div className="faculty-details-print">
        <div className="otp-section">
          <h2>Registration Already Done</h2>
          <p>To view or delete your registration, please verify with OTP sent to your registered email.</p>
          <button onClick={sendOtp} disabled={sendingOtp || otpSent}>
            {sendingOtp ? 'Sending OTP...' : otpSent ? 'OTP Sent' : 'Send OTP'}
          </button>
          {otpSent && (
            <div className="otp-input-container">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength="6"
              />
              <button onClick={verifyOtp}>Verify OTP</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Faculty details display
  return (
    <div className="faculty-details-print">
      <h2>Faculty Registration Details</h2>
      
      <div className="faculty-info">
        <p><strong>Name:</strong> {faculty.name}</p>
        <p><strong>Employee ID:</strong> {faculty.empId}</p>
        <p><strong>Preference:</strong> {faculty.preference}</p>
        <p>
          <strong>UG:</strong> {faculty.ug || "N/A"}
          <strong>UG Specialization:</strong> {faculty.ugspecialization || "N/A"}
        </p>
        <p>
          <strong>PG:</strong> {faculty.pg || "N/A"}
          <strong>PG Specialization:</strong> {faculty.pgspecialization || "N/A"}
        </p>
        <p><strong>Research Domain:</strong> {faculty.researchdomain || "N/A"}</p>
      </div>

      <div className="courses-section">
        <h3>Selected Courses</h3>
        {faculty.selectedCourses.length > 0 ? (
          <ol>
            {faculty.selectedCourses.map((course, index) => (
              <li key={index}>
                <strong>{course.courseName}</strong> ({course.courseType}, {course.domain})
              </li>
            ))}
          </ol>
        ) : (
          <p>No courses selected.</p>
        )}
      </div>

      <div className="button-container">
        <button onClick={handlePrint} className="btn-primary">Print Details</button>
        <button onClick={handleDelete} className="btn-danger">Delete Registration</button>
      </div>
    </div>
  );
};

export default FacultyDetails;
