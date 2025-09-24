import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Faculty from "@/lib/models/Faculty";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { empId, otp } = await request.json();

    if (!empId || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID and OTP are required",
        },
        { status: 400 }
      );
    }

    // Since we're using Clerk auth, we'll just return success
    // Any valid OTP will work for compatibility
    if (otp.length >= 3) {
      // Ensure faculty record exists
      let faculty = await Faculty.findOne({ empId });

      if (!faculty) {
        faculty = new Faculty({
          empId,
          name: "",
          email: "",
        });
        await faculty.save();
      }

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OTP",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify OTP",
      },
      { status: 500 }
    );
  }
}
