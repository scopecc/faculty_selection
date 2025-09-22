import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './FacultyDetails.css';

const FacultyDetails = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(false); // Don't load until OTP is verified
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    // Fetch faculty email for OTP (but do NOT fetch faculty details yet)
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

  // Send OTP to email
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

  // Verify OTP and fetch faculty details
  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, { email: facultyEmail, otp });
      setLoading(true);
      // OTP verified, fetch faculty details
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

  // If not verified, show OTP prompt
  if (!otpVerified) {
    return (
      <div className="faculty-details-print">
        <h2>Registration already done</h2>
        <p>To view or delete your registration, please verify with OTP sent to your registered email.</p>
        <button onClick={sendOtp} disabled={sendingOtp || otpSent} style={{marginBottom: '10px'}}>
          {sendingOtp ? 'Sending OTP...' : otpSent ? 'OTP Sent' : 'Send OTP'}
        </button>
        {otpSent && (
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              style={{marginRight: '10px'}}
            />
            <button onClick={verifyOtp}>Verify OTP</button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <p>Loading faculty details...</p>;

  // If verified, show details and delete option
  return (
    <div className="faculty-details-print">
      <h2>Faculty Details</h2>
      <p><strong>Name:</strong> {faculty.name}</p>
      <p><strong>Employee ID:</strong> {faculty.empId}</p>
      <p><strong>Preference:</strong> {faculty.preference}</p>
      <p><strong>UG:</strong> {faculty.ug || "N/A"} &nbsp;&nbsp;&nbsp;
      <strong>UG Specialization:</strong> {faculty.ugspecialization || "N/A"}</p>
      <p><strong>PG:</strong> {faculty.pg || "N/A"} &nbsp;&nbsp;&nbsp;
      <strong>PG Specialization:</strong> {faculty.pgspecialization || "N/A"}</p>
      <p><strong>Research Domain:</strong> {faculty.researchdomain || "N/A"}</p>

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

      <button onClick={handlePrint} className="btn btn-primary">Print</button>
      <button onClick={handleDelete} className="btn btn-danger">Delete</button>
    </div>
  );
};

export default FacultyDetails;
