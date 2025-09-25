import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Registration status
export const getRegistrationStatus = async () => {
  const response = await api.get("/registration-status");
  return response.data;
};

// OTP operations
export const sendOTP = async (empId: string) => {
  const response = await api.post("/otp/send-otp", { empId });
  return response.data;
};

export const verifyOTP = async (empId: string, otp: string) => {
  const response = await api.post("/otp/verify-otp", { empId, otp });
  return response.data;
};

// Faculty operations
export const getFacultyById = async (empId: string) => {
  const response = await api.get(`/faculty/${empId}`);
  return response.data;
};

export const getAllFaculties = async () => {
  const response = await api.get("/faculty");
  return response.data;
};

export const updateFaculty = async (
  empId: string,
  data: Record<string, unknown>
) => {
  const response = await api.put(`/faculty/${empId}`, data);
  return response.data;
};

export const deleteFaculty = async (empId: string) => {
  const response = await api.delete(`/faculty/${empId}`);
  return response.data;
};

// Course operations
export const getCourses = async () => {
  const response = await api.get("/courses");
  return response.data;
};

export const updateCourse = async (
  courseId: string,
  data: Record<string, unknown>
) => {
  const response = await api.put(`/courses/${courseId}`, data);
  return response.data;
};

export const deleteCourse = async (courseId: string) => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

// Admin operations
export const uploadFaculties = async (faculties: Record<string, unknown>[]) => {
  const response = await api.post("/faculty", { faculties });
  return response.data;
};

export const uploadCourses = async (courses: Record<string, unknown>[]) => {
  const response = await api.post("/courses", { courses });
  return response.data;
};

export const clearAllFaculties = async () => {
  const response = await api.delete("/faculty");
  return response.data;
};

export const clearAllCourses = async () => {
  const response = await api.delete("/courses");
  return response.data;
};

export default api;
