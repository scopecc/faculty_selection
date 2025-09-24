"use client";

import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  BookOpen,
  Upload,
  Download,
  Eye,
  EyeOff,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Lock,
  Unlock,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  getAllFaculties,
  getCourses,
  uploadFaculties,
  uploadCourses,
  clearAllFaculties,
  clearAllCourses,
  getRegistrationStatus,
} from "@/lib/api";
import { Faculty, Course } from "@/lib/types";

export default function Management() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data states
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);
  const [courseData, setCourseData] = useState<Course[]>([]);
  const [registrationStatus, setRegistrationStatus] = useState<
    "open" | "closed"
  >("closed");

  // File upload states
  const [facultyFile, setFacultyFile] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Display states
  const [showFacultyTable, setShowFacultyTable] = useState(true);
  const [showCourseTable, setShowCourseTable] = useState(true);

  // Admin credentials from environment
  const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || "scopewat";
  const ADMIN_PASSWORD =
    process.env.NEXT_PUBLIC_ADMIN_USER_PASSWORD || "vitcc@scope25";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simple credential check against environment variables
      if (username === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Login successful! Welcome to management dashboard",
        });
        fetchAllData();
      } else {
        toast({
          title: "Error",
          description: "Incorrect username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error during login. Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [facultyResponse, coursesResponse, statusResponse] =
        await Promise.all([
          getAllFaculties(),
          getCourses(),
          getRegistrationStatus(),
        ]);

      setFacultyData(facultyResponse.faculties || []);
      setCourseData(coursesResponse.courses || []);
      setRegistrationStatus(statusResponse.status);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRegistrationStatus = async () => {
    try {
      const newStatus = registrationStatus === "open" ? "closed" : "open";
      // Here you would call an API to toggle registration status
      // For now, we'll just toggle locally
      setRegistrationStatus(newStatus);
      toast({
        title: "Success",
        description: `Registration has been ${
          newStatus === "open" ? "opened" : "closed"
        }!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle registration status",
        variant: "destructive",
      });
    }
  };

  const handleFacultyFileUpload = async () => {
    if (!facultyFile) {
      toast({
        title: "Error",
        description: "Please select a faculty file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          // Normalize and map faculty data
          const normalizedData = jsonData.map((row: any) => ({
            empId: row.empId || row["Emp ID"] || row.employeeId || "",
            name: row.name || row["Name"] || row.facultyName || "",
            email: row.email || row["Email"] || "",
            department: row.department || row["Department"] || "",
            designation: row.designation || row["Designation"] || "",
          }));

          await uploadFaculties(normalizedData);
          toast({
            title: "Success",
            description: "Faculty data uploaded successfully!",
          });
          fetchAllData();
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process faculty file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(facultyFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload faculty file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCourseFileUpload = async () => {
    if (!courseFile) {
      toast({
        title: "Error",
        description: "Please select a course file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          // Normalize and map course data
          const normalizedData = jsonData.map((row: any) => ({
            courseId: row.courseId || row["Course ID"] || row.course_id || "",
            courseName:
              row.courseName || row["Course Name"] || row.course_name || "",
            type: row.type || row["Type"] || row.courseType || "UG",
            credits: parseInt(row.credits || row["Credits"] || "3"),
            department: row.department || row["Department"] || "",
            semester: row.semester || row["Semester"] || "",
          }));

          await uploadCourses(normalizedData);
          toast({
            title: "Success",
            description: "Course data uploaded successfully!",
          });
          fetchAllData();
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process course file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(courseFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload course file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClearAllFaculties = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all faculty data? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await clearAllFaculties();
      toast({
        title: "Success",
        description: "All faculty data cleared successfully",
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear faculty data",
        variant: "destructive",
      });
    }
  };

  const handleClearAllCourses = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all course data? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await clearAllCourses();
      toast({
        title: "Success",
        description: "All course data cleared successfully",
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear course data",
        variant: "destructive",
      });
    }
  };

  const downloadFacultyExcel = () => {
    const excelData = facultyData.map((faculty, index) => ({
      "S.No": index + 1,
      "Employee ID": faculty.empId,
      Name: faculty.name,
      Email: faculty.email,
      Preference: faculty.preference || "Not set",
      "Selected Courses": faculty.selectedCourses?.length || 0,
      "Submission Time": faculty.submissionTime
        ? new Date(faculty.submissionTime).toLocaleString()
        : "Not submitted",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Data");
    XLSX.writeFile(wb, "faculty_data.xlsx");
  };

  const downloadCourseExcel = () => {
    const excelData = courseData.map((course, index) => ({
      "S.No": index + 1,
      "Course ID": course.courseId,
      "Course Name": course.courseName,
      Type: course.type,
      Credits: course.credits,
      "Assigned Faculty": course.facultyName || "Not assigned",
      "Faculty ID": course.facultyEmpId || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Data");
    XLSX.writeFile(wb, "course_data.xlsx");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SignedOut>
          <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  Please sign in to access this page
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-2xl">Admin Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access the management dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Login
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </SignedIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SignedIn>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Management Dashboard</h1>
              <p className="text-muted-foreground">
                Faculty Course Selection System Administration
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>

          {/* Registration Status Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Registration Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Control faculty registration access
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      registrationStatus === "open" ? "default" : "secondary"
                    }
                  >
                    {registrationStatus === "open" ? (
                      <>
                        <Unlock className="w-3 h-3 mr-1" />
                        Open
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Closed
                      </>
                    )}
                  </Badge>
                  <Switch
                    checked={registrationStatus === "open"}
                    onCheckedChange={toggleRegistrationStatus}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="faculties">Faculties</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="uploads">Data Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Faculties
                    </CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {facultyData.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registered faculty members
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Courses
                    </CardTitle>
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {courseData.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available courses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Submissions
                    </CardTitle>
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        facultyData.filter(
                          (f) =>
                            f.selectedCourses && f.selectedCourses.length > 0
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Faculty submissions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="faculties" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Faculty Management
                    </CardTitle>
                    <CardDescription>
                      View and manage faculty registrations
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadFacultyExcel}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFacultyTable(!showFacultyTable)}
                    >
                      {showFacultyTable ? (
                        <EyeOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {showFacultyTable ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showFacultyTable && (
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>S.No</TableHead>
                            <TableHead>Emp ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Preference</TableHead>
                            <TableHead>Courses</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facultyData.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No faculty data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            facultyData.map((faculty, index) => (
                              <TableRow key={faculty.empId}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-mono">
                                  {faculty.empId}
                                </TableCell>
                                <TableCell>{faculty.name || "N/A"}</TableCell>
                                <TableCell>{faculty.email}</TableCell>
                                <TableCell>
                                  {faculty.preference ? (
                                    <Badge
                                      variant={
                                        faculty.preference === "UG"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {faculty.preference}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Not set
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {faculty.selectedCourses?.length || 0}
                                </TableCell>
                                <TableCell>
                                  {faculty.selectedCourses &&
                                  faculty.selectedCourses.length > 0 ? (
                                    <Badge variant="default">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Submitted
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Course Management
                    </CardTitle>
                    <CardDescription>
                      View and manage available courses
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCourseExcel}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCourseTable(!showCourseTable)}
                    >
                      {showCourseTable ? (
                        <EyeOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {showCourseTable ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showCourseTable && (
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>S.No</TableHead>
                            <TableHead>Course ID</TableHead>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Assigned Faculty</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courseData.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No course data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            courseData.map((course, index) => (
                              <TableRow key={course._id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-mono">
                                  {course.courseId}
                                </TableCell>
                                <TableCell>{course.courseName}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      course.type === "UG"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {course.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{course.credits}</TableCell>
                                <TableCell>
                                  {course.facultyName ? (
                                    <div>
                                      <div className="font-medium">
                                        {course.facultyName}
                                      </div>
                                      <div className="text-sm text-muted-foreground font-mono">
                                        {course.facultyEmpId}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Unassigned
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {course.facultyName ? (
                                    <Badge variant="default">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Assigned
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Available
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="uploads" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Faculty Data Upload
                    </CardTitle>
                    <CardDescription>
                      Upload faculty information via Excel file
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="faculty-file">
                        Select Faculty Excel File
                      </Label>
                      <Input
                        id="faculty-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) =>
                          setFacultyFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFacultyFileUpload}
                        disabled={!facultyFile || uploading}
                        className="flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Faculty Data
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearAllFaculties}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Course Data Upload
                    </CardTitle>
                    <CardDescription>
                      Upload course information via Excel file
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="course-file">
                        Select Course Excel File
                      </Label>
                      <Input
                        id="course-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) =>
                          setCourseFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCourseFileUpload}
                        disabled={!courseFile || uploading}
                        className="flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Course Data
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearAllCourses}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Refresh Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Refresh and manage application data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={fetchAllData}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh All Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SignedIn>
    </div>
  );
}
