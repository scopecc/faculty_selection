"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  Clock,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { getFacultyById, getCourses } from "@/lib/api";
import { Faculty, Course } from "@/lib/types";

export default function FacultyDetails() {
  const router = useRouter();
  const params = useParams();
  const empId = params.empId as string;

  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empId) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const [facultyResponse, coursesResponse] = await Promise.all([
          getFacultyById(empId),
          getCourses(),
        ]);

        if (facultyResponse.faculty) {
          setFaculty(facultyResponse.faculty);

          // Get the actual course objects for selected courses
          const facultySelectedCourses = coursesResponse.courses.filter(
            (course: Course) =>
              facultyResponse.faculty.selectedCourses?.includes(course._id)
          );
          setSelectedCourses(facultySelectedCourses);
        } else {
          setError("Faculty not found");
        }

        setCourses(coursesResponse.courses);
      } catch (error: any) {
        console.error("Error fetching faculty data:", error);
        setError(
          error.response?.data?.message || "Failed to load faculty data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empId, router]);

  const handleEditCourses = () => {
    if (!faculty) return;
    router.push(
      `/course-selection?empId=${empId}&email=${encodeURIComponent(
        faculty.email
      )}&preference=${faculty.preference}`
    );
  };

  if (!empId) {
    return null;
  }

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
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex items-center gap-4 mb-4">
              <User className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Faculty Details</h1>
                <p className="text-muted-foreground">Employee ID: {empId}</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p>Loading faculty details...</p>
              </CardContent>
            </Card>
          ) : faculty ? (
            <div className="space-y-6">
              {/* Faculty Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Faculty Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Name
                      </p>
                      <p className="text-lg">
                        {faculty.name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Employee ID
                      </p>
                      <p className="text-lg font-mono">{faculty.empId}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p>{faculty.email}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Course Preference
                      </p>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <Badge
                          variant={
                            faculty.preference === "UG"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {faculty.preference}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {faculty.submissionTime && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last updated:{" "}
                          {new Date(faculty.submissionTime).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Selected Courses Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Selected Courses
                    </CardTitle>
                    <CardDescription>
                      Courses selected for teaching
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleEditCourses}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Selection
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No courses selected yet
                      </p>
                      <Button onClick={handleEditCourses}>
                        Select Courses
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCourses.map((course) => (
                        <div
                          key={course._id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">
                                {course.courseName}
                              </h3>
                              <Badge variant="secondary">
                                {course.courseId}
                              </Badge>
                              <Badge variant="outline">
                                {course.credits} Credits
                              </Badge>
                              <Badge
                                variant={
                                  course.type === "UG" ? "default" : "secondary"
                                }
                              >
                                {course.type}
                              </Badge>
                            </div>
                            {course.facultyName &&
                              course.facultyEmpId !== faculty.empId && (
                                <p className="text-sm text-muted-foreground">
                                  Also requested by: {course.facultyName}
                                </p>
                              )}
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Card */}
              {selectedCourses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selection Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {selectedCourses.length}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Courses Selected
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {selectedCourses.reduce(
                            (total, course) => total + course.credits,
                            0
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Credits
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {
                            selectedCourses.filter((c) => c.type === "UG")
                              .length
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          UG Courses
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {
                            selectedCourses.filter((c) => c.type === "PG")
                              .length
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PG Courses
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Faculty not found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </SignedIn>
    </div>
  );
}
