import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Faculty from "@/lib/models/Faculty";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await connectDB();

    const { empId } = await params;
    const faculty = await Faculty.findOne({ empId });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculty" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await connectDB();

    const { empId } = await params;
    const updateData = await request.json();

    const faculty = await Faculty.findOneAndUpdate(
      { empId },
      {
        ...updateData,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      message: "Faculty updated successfully",
      faculty,
    });
  } catch (error) {
    console.error("Error updating faculty:", error);
    return NextResponse.json(
      { error: "Failed to update faculty" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    await connectDB();

    const { empId } = await params;
    const faculty = await Faculty.findOneAndDelete({ empId });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Faculty deleted successfully",
      faculty,
    });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    return NextResponse.json(
      { error: "Failed to delete faculty" },
      { status: 500 }
    );
  }
}
