import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '⚠';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast ${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// Toast container component
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Home = ({ setEmpId, setFacultyEmail, setPreference }) => {
  const [facultyEmpid, setLocalFacultyEmpid] = useState("");
  const [facultyEmail, setLocalFacultyEmail] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const [registrationStatus, setRegistrationStatus] = useState("Loading");

  // Toast management functions
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/registration-status`)
      .then(response => {
        setRegistrationStatus(response.data.status);
      })
      .catch(error => {
        console.error("Error fetching registration status:", error);
        addToast("Failed to load registration status", "error");
      });
  }, []);

  const sendOtp = async () => {
    setLoading(true);
    const empId = facultyEmpid;

    try {
      const response = await axios.get("/faculties.json");
      const faculties = response.data;
      const faculty = faculties.find((fac) => fac.empId == facultyEmpid);

      if (!faculty) {
        addToast("Faculty not found. Please check the Employee ID.", "error");
        setLoading(false);
        return;
      }

      const facultyEmail = faculty.email;
      setLocalFacultyEmail(facultyEmail);

      // Check if already registered
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${facultyEmpid}`);
        if (response.data.exists) {
          addToast("You have already registered.", "warning");
          navigate(`/faculty/${empId}`);
          return;
        }
      } catch (error) {
        console.error("Error Checking DB:", error);
        addToast("Failed to check registration status. Please try again.", "error");
        setLoading(false);
        return;
      }

      // Send OTP
      try {
        const otpResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/send-otp`, {
          email: facultyEmail,
        });
        setOtpSent(true);
        addToast("OTP sent to your registered email address", "success");
      } catch (error) {
        console.error("Error sending OTP:", error);
        addToast("Failed to send OTP. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error loading faculty data:", error);
      addToast("Failed to load faculty data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      addToast("Please verify your email first.", "warning");
      return;
    }

    if (!otp || otp.length !== 6) {
      addToast("Please enter a valid 6-digit OTP.", "warning");
      return;
    }

    setLoading(true);

    try {
      const verifyResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, {
        email: facultyEmail,
        otp: otp,
      });

      const empId = facultyEmpid;

      if (facultyEmail && facultyEmpid) {
        localStorage.setItem("empId", empId);
        localStorage.setItem("facultyEmail", facultyEmail);

        // Double-check if already registered
        const checkResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`
        );
        if (checkResponse.data.exists) {
          addToast("You have already registered.", "warning");
          return;
        }

        addToast("Email verified successfully! Redirecting...", "success");
        setTimeout(() => {
          navigate("/course-selection", { state: { facultyEmail, empId } });
        }, 1500);
      } else {
        addToast("Invalid Employee ID or Email.", "error");
      }
    } catch (error) {
      console.error("❌ OTP Verification Failed:", error.response?.data);
      addToast("Invalid OTP. Please check and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (registrationStatus === "Loading") {
    return (
      <>
        <div className="home-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading registration status...</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Registration closed state
  if (registrationStatus !== "OPEN") {
    return (
      <>
        <div className="home-container">
          <h1>Faculty Registration</h1>
          <div className="registration-closed">
            <h2>Registration Closed</h2>
            <p>The registration period has ended. Please contact the administrator for assistance.</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Main registration form
  return (
    <>
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
            <button type="button" onClick={sendOtp} disabled={loading || !facultyEmpid}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          )}

          {otpSent && (
            <>
              <div className="success-notification">
                OTP has been sent to your registered email address
              </div>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                required
              />

              <button type="submit" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </>
          )}
        </form>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default Home;