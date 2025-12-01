'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';

interface Draft {
  _id: string;
  name: string;
}

  const DraftSelectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [empIdState, setEmpIdState] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [openDrafts, setOpenDrafts] = useState<Draft[]>([]);

  console.log("DraftSelectionPage: Initial render, empId from searchParams:", searchParams.get('empId'));

  useEffect(() => {
    console.log("DraftSelectionPage: useEffect started.");
    let currentEmpId = searchParams.get('empId');
    console.log("DraftSelectionPage: empId from searchParams inside useEffect:", currentEmpId);

    if (!currentEmpId) {
      currentEmpId = localStorage.getItem("redirectEmpId");
      console.log("DraftSelectionPage: empId from localStorage:", currentEmpId);
      if (currentEmpId) {
        localStorage.removeItem("redirectEmpId");
        console.log("DraftSelectionPage: removed redirectEmpId from localStorage.");
      }
    }

    if (!currentEmpId) {
      console.log("DraftSelectionPage: No empId found, redirecting to /.");
      toast.error("Employee ID not found. Please log in again.");
      router.replace('/');
      return;
    }

    setEmpIdState(currentEmpId);
    console.log("DraftSelectionPage: empIdState set to:", currentEmpId);

    const fetchInitialData = async () => {
      try {
        // Fetch faculty email
        const facultyRes = await axios.get('/faculties.json');
        const faculties = facultyRes.data;
        const fac = faculties.find((f: { empId: string; email: string; }) => String(f.empId) === String(currentEmpId));
        if (fac) {
          setFacultyEmail(fac.email);
        } else {
          toast.error("Faculty email not found.");
          setLoading(false);
          return;
        }

        // Fetch drafts and filter for open ones
        const draftsRes = await axios.get(`/api/drafts/list`);
        const allDrafts: Draft[] = draftsRes.data || [];
        console.log("DraftSelectionPage: allDrafts fetched:", allDrafts);

        const statuses = await Promise.all(
          allDrafts.map(async (d) => {
            try {
              const r = await axios.get(`/api/registration-status`, { params: { draftId: d._id } });
              return { draft: d, status: r.data?.status as string };
            } catch (error) {
              console.error(`DraftSelectionPage: Failed to fetch status for draft ${d._id}:`, error);
              return { draft: d, status: 'CLOSED' };
            }
          })
        );
        console.log("DraftSelectionPage: statuses after Promise.all:", statuses);

        const open = statuses.filter(s => s.status === 'OPEN').map(s => s.draft);
        console.log("DraftSelectionPage: open drafts after filtering:", open);
        setOpenDrafts(open);

        if (open.length > 0) {
          setSelectedDraftId(open[0]._id);
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [searchParams, router]);

  const sendOtp = async () => {
    if (!facultyEmail) {
      toast.error("Faculty email not found. Cannot send OTP.");
      return;
    }
    if (!selectedDraftId) {
      toast.error("Please select a draft first.");
      return;
    }
    setSendingOtp(true);
    try {
      await axios.post(`/api/otp/send-otp`, { email: facultyEmail });
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (_error) {
      toast.error("Failed to send OTP. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }
    if (!selectedDraftId || !empIdState) {
      toast.error("Please select a draft and ensure Employee ID is present.");
      return;
    }
    setVerifyingOtp(true);
    try {
      await axios.post(`/api/otp/verify-otp`, { email: facultyEmail, otp, empId: empIdState, draftId: selectedDraftId });
      toast.success("OTP verified successfully! Redirecting...");
      // Upon successful OTP verification, redirect to the faculty details page
      router.push(`/faculty/${empIdState}?draftId=${selectedDraftId}`);
    } catch (_error) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-dashed border-accent/60"
        />
        <Toaster richColors />
      </div>
    );
  }

  if (openDrafts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md bg-card/60 backdrop-blur border border-border/40 rounded-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">No Drafts Available</CardTitle>
            <CardDescription className="text-muted-foreground">There are no drafts to view registrations for.</CardDescription>
          </CardHeader>
        </Card>
        <Toaster richColors />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md bg-card/60 border border-border/40 rounded-2xl backdrop-blur relative overflow-hidden transition-transform duration-200 ease-[var(--ease-smooth)] hover:scale-[1.01]">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-semibold tracking-tight">Select a Draft</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You are already registered. Please select a draft to view or manage your submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="draft-select" className="text-xs font-medium text-muted-foreground">Choose an Open Draft</label>
              <Select onValueChange={setSelectedDraftId} value={selectedDraftId || ''}>
                <SelectTrigger className="bg-transparent hover:bg-secondary/40 transition-colors">
                  <SelectValue placeholder="Select a draft" />
                </SelectTrigger>
                <SelectContent>
                  {openDrafts.map(draft => (
                    <SelectItem key={draft._id} value={draft._id}>{draft.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!otpSent && (
              <Button onClick={sendOtp} disabled={!selectedDraftId || sendingOtp} className="w-full py-5 text-base transition-transform duration-200 hover:scale-[1.02] bg-green-600 text-white hover:bg-green-700">
                {sendingOtp ? 'Sending OTP...' : 'View My Registration'}
              </Button>
            )}

            {otpSent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 text-sm text-center rounded-lg bg-secondary/70 text-secondary-foreground">
                  An OTP has been sent to your registered email address.
                </div>

                <div className="space-y-2">
                  <label htmlFor="otp" className="text-xs font-medium text-muted-foreground">One-Time Password</label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required
                    className="bg-transparent text-center text-2xl tracking-[0.5em] py-5"
                  />
                </div>

                <Button onClick={verifyOtp} disabled={!otp || otp.length !== 6 || verifyingOtp} className="w-full py-5 text-base transition-transform duration-200 hover:scale-[1.02] bg-green-600 text-white hover:bg-green-700">
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP & View'}
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
      <Toaster richColors theme="dark" />
    </div>
  );
};

export default DraftSelectionPage;
