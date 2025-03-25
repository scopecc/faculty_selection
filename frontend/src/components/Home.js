import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

const Home = ({ setEmpId, setFacultyEmail, setPreference }) => {
  const [facultyEmpid, setLocalFacultyEmpid] = useState("");
  const [facultyEmail, setLocalFacultyEmail] = useState("");
  const [empIdInput, setEmpIdInput] = useState("");
  // const [preference, setLocalPreference] = useState("");
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

  // ✅ Function to request OTP
  const sendOtp = async () => {
    setLoading(true);
    const empId = facultyEmpid;
    const response = await axios.get("/faculties.json");
    const faculties = response.data;
    const faculty = faculties.find((fac) => fac.empId == facultyEmpid);

    if (!faculty) {
      alert("Faculty not found. Please check the Employee ID.");
      setLoading(false);
      return; // Stop execution if faculty is not found
    }
    const facultyEmail = faculty.email; // Now it is safe to access
    setLocalFacultyEmail(facultyEmail); // Save email in state

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

  // ✅ Function to handle OTP verification and registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert("Please verify your email first.");
      return;
    }

    try {
      const verifyResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/otp/verify-otp`, {
        email: facultyEmail,
        otp: otp, // ✅ Send entered OTP to backend
      });

      // Proceed with faculty check
      const empId = facultyEmpid;

      if (facultyEmail && facultyEmpid) {
        localStorage.setItem("empId", empId);
        localStorage.setItem("facultyEmail", facultyEmail);
        // localStorage.setItem("preference", preference);

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

  return (
    <div className="home-container">
      <h1>Faculty Registration</h1><br></br><br></br>
      {registrationStatus == "Loading"
        ?
        <div>
          Loading...
        </div>
        :
        registrationStatus == "OPEN" 
          ?
            <form onSubmit={handleSubmit} className="home-form">
              {/* Faculty Email Input */}
              <input
                type="number"
                placeholder="Faculty Employee ID"
                value={facultyEmpid}
                onChange={(e) => setLocalFacultyEmpid(e.target.value)}
                required
              />
              
              {/* Send OTP Button */}
              {!otpSent && (
                <button type="button" onClick={sendOtp} disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              )}

              {/* Show OTP Sent Text */}
              {otpSent && <p>OTP has been sent to your email.</p>}

              {/* Show OTP Input only after OTP is Sent */}
              {otpSent && (
                <div> 
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <button style={{width:"250px"}} type="submit">Sign In</button>
                </div>
              )}

              {/* {otpSent && <p>1. If you are more preferred to choose <b>Theory only course</b>, then select <strong>"Theory"</strong> and make your choices appropriately <br></br>
                2. If you are more preferred to choose <b>Lab oriented courses</b>, then select <strong>"Theory+Lab"</strong> and make your choices appropriately </p>} */}

              {/* Show Employee ID & Preference only after OTP is Sent */}
              {/* {otpSent && (
                <>
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

                </>
              )} */}
            </form> 
          :
            <div>
              Registration Closed
            </div>
      }
    </div>
  );
};

export default Home;
