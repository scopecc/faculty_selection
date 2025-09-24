export interface Faculty {
  empId: string;
  name: string;
  email: string;
  preference?: "UG" | "PG";
  selectedCourses?: string[];
  submissionTime?: Date;
}

export interface Course {
  _id: string;
  courseId: string;
  courseName: string;
  type: "UG" | "PG";
  credits: number;
  facultyEmpId?: string;
  facultyName?: string;
}

export interface RegistrationStatus {
  status: "open" | "closed";
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}
