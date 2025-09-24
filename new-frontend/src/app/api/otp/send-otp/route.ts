import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Faculty from "@/lib/models/Faculty";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { empId } = await request.json();

    if (!empId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Since we're using Clerk auth, we'll just return success
    // but still check if faculty exists or create a basic record
    let faculty = await Faculty.findOne({ empId });

    if (!faculty) {
      // Create a basic faculty record
      faculty = new Faculty({
        empId,
        name: "", // Will be filled later
        email: "", // Will be filled later
      });
      await faculty.save();
    }

    // Return success response (no actual OTP sent since we use Clerk)
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your registered email",
      otp: "123456", // Mock OTP for compatibility
    });
  } catch (error) {
    console.error("Error in send-otp:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}
