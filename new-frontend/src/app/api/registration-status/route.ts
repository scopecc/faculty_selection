import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Registration from "@/lib/models/Registration";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get or create registration status
    let registration = await Registration.findOne();
    if (!registration) {
      registration = new Registration({ status: "closed" });
      await registration.save();
    }

    return NextResponse.json({ status: registration.status });
  } catch (error) {
    console.error("Error fetching registration status:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { status } = await request.json();

    if (!status || !["open", "closed"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "open" or "closed"' },
        { status: 400 }
      );
    }

    // Update or create registration status
    let registration = await Registration.findOne();
    if (!registration) {
      registration = new Registration({ status });
    } else {
      registration.status = status;
      registration.updatedAt = new Date();
    }

    await registration.save();

    return NextResponse.json({
      message: `Registration status updated to ${status}`,
      status: registration.status,
    });
  } catch (error) {
    console.error("Error updating registration status:", error);
    return NextResponse.json(
      { error: "Failed to update registration status" },
      { status: 500 }
    );
  }
}
