'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from "sonner";

interface IFaculty {
  name: string;
  empId: number;
  ugspecialization?: string;
  pgspecialization?: string;
  researchdomain?: string;
  willingness: boolean;
  selectedCourses: {
    courseName: string;
    courseType: string;
    domain: string;
  }[];
}

interface IDraft {
  _id: string;
  name: string;
}

const FacultyDetails = () => {
  const params = useParams();
  const empId = params.empId as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');

  const [faculty, setFaculty] = useState<IFaculty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empId || !draftId) {
      toast.error("Employee ID or Draft ID not found.");
      router.replace('/');
      return;
    }

    const fetchFacultyData = async () => {
      try {
        const response = await axios.get(`/api/faculty/check/${empId}`, { params: { draftId } });
        if (response.data.exists) {
          setFaculty(response.data.faculty);
        } else {
          setFaculty(null);
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
        toast.error("Failed to fetch faculty data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [empId, draftId, router]);

  const handleDelete = async () => {
    if (!draftId) {
      toast.error("Draft ID not found.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this faculty record for the selected draft?")) {
      try {
        await axios.delete(`/api/faculty/delete/${empId}`, {
          params: { draftId }
        });
        toast.success("Faculty record deleted successfully.");
        router.push(`/faculty/draft-selection?empId=${empId}`); // Redirect back to draft selection
      } catch (error) {
        console.error("Error deleting faculty:", error);
        toast.error("Error deleting faculty.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-14 h-14 border-4 border-dashed rounded-full animate-spin border-accent/70"></div>
          <p className="text-sm text-muted-foreground">Loading faculty details...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md bg-card/60 backdrop-blur border border-border/40 rounded-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">No Registration Found</CardTitle>
            <CardDescription className="text-muted-foreground">No registration found for Employee ID: {empId} in the selected draft.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push(`/faculty/draft-selection?empId=${empId}`)} className="transition-transform duration-200 hover:scale-[1.02]">
              Select another Draft
            </Button>
          </CardContent>
        </Card>
        <Toaster richColors />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-100">
      <Card className="w-full max-w-3xl shadow-xl rounded-lg bg-white text-gray-900">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold tracking-tight">Faculty Registration Details</CardTitle>
          <CardDescription className="text-sm text-gray-600">Details for Employee ID: {empId} in the selected draft.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {faculty ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg font-semibold">{faculty.name}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Employee ID</p>
                  <p className="text-lg font-semibold">{faculty.empId}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">UG Specialization</p>
                  <p className="text-lg">{faculty.ugspecialization || "N/A"}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">PG Specialization</p>
                  <p className="text-lg">{faculty.pgspecialization || "N/A"}</p>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Research Domain</p>
                  <p className="text-lg">{faculty.researchdomain || "N/A"}</p>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Willingness to take an extra course</p>
                  <p className="text-lg">{faculty.willingness ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">Selected Courses</h3>
                {faculty.selectedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faculty.selectedCourses.map((course, index: number) => (
                      <Card key={index} className="p-4 bg-gray-50 rounded-md shadow-sm">
                        <p className="text-base font-semibold">{course.courseName}</p>
                        <p className="text-sm text-gray-600">Type: {course.courseType}</p>
                        <p className="text-sm text-gray-600">Domain: {course.domain}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No courses selected for this registration.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600">No registration data available.</p>
          )}
        </CardContent>
        <div className="flex justify-end p-6 space-x-3 border-t border-gray-200">
          <Button onClick={handlePrint} variant="outline" className="transition-transform duration-200 hover:scale-[1.02]">Print Details</Button>
          <Button onClick={handleDelete} variant="destructive" className="transition-transform duration-200 hover:scale-[1.02]">Delete Registration</Button>
        </div>
      </Card>
      <Toaster richColors />
    </div>
  );
};

export default FacultyDetails;
