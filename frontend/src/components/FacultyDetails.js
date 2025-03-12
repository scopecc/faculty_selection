import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './FacultyDetails.css';

const FacultyDetails = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch faculty details
    const fetchFaculty = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/faculty/check/${empId}`);
        if (response.data.exists) {
          setFaculty(response.data.faculty);
        } else {
          alert("Faculty not found!");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching faculty details:", error);
        alert("Error fetching faculty details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [empId, navigate]);

  const handleDelete = async () => {
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

  if (loading) return <p>Loading faculty details...</p>;

  return (
    <div className="faculty-details">
      <h2>Faculty Details</h2>
      <p><strong>Name:</strong> {faculty.name}</p>
      <p><strong>Employee ID:</strong> {faculty.empId}</p>
      <p><strong>Preference:</strong> {faculty.preference}</p>
      <p><strong>UG:</strong> {faculty.ug || "N/A"}</p>
      <p><strong>UG Specialization:</strong> {faculty.ugspecialization || "N/A"}</p>
      <p><strong>PG:</strong> {faculty.pg || "N/A"}</p>
      <p><strong>PG Specialization:</strong> {faculty.pgspecialization || "N/A"}</p>
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
