"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
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
import { Loader2, Mail, User, GraduationCap, Users } from "lucide-react";
import { getRegistrationStatus, sendOTP, verifyOTP } from "@/lib/api";
import { RegistrationStatus } from "@/lib/types";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus["status"]>("closed");
  const [facultyEmpid, setFacultyEmpid] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [preference, setPreference] = useState<"UG" | "PG" | "">("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        const response = await getRegistrationStatus();
        setRegistrationStatus(response.status);
      } catch (error) {
        console.error("Error fetching registration status:", error);
      }
    };
    fetchRegistrationStatus();
  }, []);

  const handleSendOtp = async () => {
    if (!facultyEmpid.trim()) {
      setError("Please enter your Employee ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendOTP(facultyEmpid);
      if (response.success) {
        setOtpSent(true);
        setSuccess("OTP sent successfully to your registered email");
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verifyOTP(facultyEmpid, otp);
      if (response.success) {
        setSuccess("OTP verified successfully!");
        // Navigate to course selection
        router.push(
          `/course-selection?empId=${facultyEmpid}&email=${encodeURIComponent(
            facultyEmail
          )}&preference=${preference}`
        );
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SignedOut>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Please sign in to access the Faculty Selection Tool
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto py-8 px-4">
          {registrationStatus === "closed" ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
              <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="text-2xl">
                    Registration Closed
                  </CardTitle>
                  <CardDescription>
                    The faculty course selection registration is currently
                    closed. Please check back later or contact the
                    administrator.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
              <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                  <User className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-2xl">
                    Faculty Authentication
                  </CardTitle>
                  <CardDescription>
                    Enter your details to access the course selection system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="empId">Employee ID</Label>
                      <Input
                        id="empId"
                        placeholder="Enter your Employee ID"
                        value={facultyEmpid}
                        onChange={(e) => setFacultyEmpid(e.target.value)}
                        disabled={otpSent}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={facultyEmail}
                        onChange={(e) => setFacultyEmail(e.target.value)}
                        disabled={otpSent}
                      />
                    </div>

                    <div>
                      <Label htmlFor="preference">Course Preference</Label>
                      <select
                        id="preference"
                        className="w-full p-2 border border-input rounded-md bg-background"
                        value={preference}
                        onChange={(e) =>
                          setPreference(e.target.value as "UG" | "PG")
                        }
                        disabled={otpSent}
                      >
                        <option value="">Select your preference</option>
                        <option value="UG">Undergraduate (UG)</option>
                        <option value="PG">Postgraduate (PG)</option>
                      </select>
                    </div>
                  </div>

                  {!otpSent ? (
                    <Button
                      onClick={handleSendOtp}
                      className="w-full"
                      disabled={
                        loading || !facultyEmpid || !facultyEmail || !preference
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send OTP
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          placeholder="Enter the OTP sent to your email"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleVerifyOtp}
                          className="flex-1"
                          disabled={loading || !otp}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify & Continue"
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                            setError("");
                            setSuccess("");
                          }}
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Button
                      variant="link"
                      onClick={() => router.push("/management")}
                      className="text-sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Admin Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}
