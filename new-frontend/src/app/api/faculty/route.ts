import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Faculty from "@/lib/models/Faculty";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const faculties = await Faculty.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      faculties,
      count: faculties.length,
    });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { faculties } = await request.json();

    if (!Array.isArray(faculties) || faculties.length === 0) {
      return NextResponse.json(
        { error: "Faculties array is required" },
        { status: 400 }
      );
    }

    // Bulk insert/update faculties
    const results = [];
    for (const facultyData of faculties) {
      try {
        const faculty = await Faculty.findOneAndUpdate(
          { empId: facultyData.empId },
          {
            ...facultyData,
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );
        results.push(faculty);
      } catch (error) {
        console.error(`Error processing faculty ${facultyData.empId}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} faculties`,
      faculties: results,
    });
  } catch (error) {
    console.error("Error processing faculties:", error);
    return NextResponse.json(
      { error: "Failed to process faculties" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    await connectDB();

    await Faculty.deleteMany({});

    return NextResponse.json({
      message: "All faculty data cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing faculties:", error);
    return NextResponse.json(
      { error: "Failed to clear faculties" },
      { status: 500 }
    );
  }
}
