"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getCourses, getFacultyById, updateFaculty } from "@/lib/api";
import { Course, Faculty } from "@/lib/types";

function CourseSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const empId = searchParams.get("empId");
  const email = searchParams.get("email");
  const preference = searchParams.get("preference") as "UG" | "PG";

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!empId || !preference) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch courses and faculty data
        const [coursesResponse, facultyResponse] = await Promise.all([
          getCourses(),
          getFacultyById(empId),
        ]);

        // Filter courses by preference
        const filteredCourses = coursesResponse.courses.filter(
          (course: Course) => course.type === preference
        );
        setCourses(filteredCourses);

        if (facultyResponse.faculty) {
          setFaculty(facultyResponse.faculty);
          setSelectedCourses(facultyResponse.faculty.selectedCourses || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empId, preference, router]);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await updateFaculty(empId!, {
        selectedCourses,
        preference,
        email: decodeURIComponent(email!),
        submissionTime: new Date(),
      });

      setSuccess("Course selection submitted successfully!");
      setTimeout(() => {
        router.push(`/faculty/${empId}`);
      }, 2000);
    } catch (error: unknown) {
      setError(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to submit course selection"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!empId || !preference) {
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
                <h1 className="text-3xl font-bold">Course Selection</h1>
                <p className="text-muted-foreground">
                  Employee ID: {empId} | Preference: {preference}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p>Loading courses...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Available {preference} Courses
                  </CardTitle>
                  <CardDescription>
                    Select the courses you would like to teach. You can select
                    multiple courses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No {preference} courses available at the moment.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div
                          key={course._id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={course._id}
                            checked={selectedCourses.includes(course._id)}
                            onCheckedChange={() =>
                              handleCourseToggle(course._id)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={course._id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span>{course.courseName}</span>
                                <Badge variant="secondary">
                                  {course.courseId}
                                </Badge>
                                <Badge variant="outline">
                                  {course.credits} Credits
                                </Badge>
                                <Badge
                                  variant={
                                    course.type === "UG"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {course.type}
                                </Badge>
                              </div>
                              {course.facultyName && (
                                <p className="text-xs text-muted-foreground">
                                  Currently assigned to: {course.facultyName}
                                </p>
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedCourses.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Selected Courses ({selectedCourses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCourses.map((courseId) => {
                        const course = courses.find((c) => c._id === courseId);
                        if (!course) return null;
                        return (
                          <div
                            key={courseId}
                            className="flex items-center justify-between p-3 bg-accent/50 rounded-md"
                          >
                            <div>
                              <span className="font-medium">
                                {course.courseName}
                              </span>
                              <Badge variant="secondary" className="ml-2">
                                {course.courseId}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCourseToggle(courseId)}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || selectedCourses.length === 0}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Course Selection
                    </>
                  )}
                </Button>

                {faculty?.selectedCourses &&
                  faculty.selectedCourses.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/faculty/${empId}`)}
                    >
                      View Submitted Details
                    </Button>
                  )}
              </div>

              {faculty?.submissionTime && (
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        Last submitted:{" "}
                        {new Date(faculty.submissionTime).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SignedIn>
    </div>
  );
}

export default function CourseSelection() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseSelectionContent />
    </Suspense>
  );
}
