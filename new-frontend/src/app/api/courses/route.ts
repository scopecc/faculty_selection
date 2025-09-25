import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Course from "@/lib/models/Course";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // UG or PG

    let query = {};
    if (type && ["UG", "PG"].includes(type)) {
      query = { type };
    }

    const courses = await Course.find(query).sort({ courseName: 1 });

    return NextResponse.json({
      courses,
      count: courses.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { courses } = await request.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: "Courses array is required" },
        { status: 400 }
      );
    }

    // Bulk insert/update courses
    const results = [];
    for (const courseData of courses) {
      try {
        // Ensure required fields
        if (!courseData.courseId || !courseData.courseName) {
          console.error("Missing required fields for course:", courseData);
          continue;
        }

        const course = await Course.findOneAndUpdate(
          { courseId: courseData.courseId },
          {
            ...courseData,
            type: courseData.type || courseData.courseType || "UG", // Handle both field names
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );
        results.push(course);
      } catch (error) {
        console.error(`Error processing course ${courseData.courseId}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} courses`,
      courses: results,
    });
  } catch (error) {
    console.error("Error processing courses:", error);
    return NextResponse.json(
      { error: "Failed to process courses" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    await connectDB();

    await Course.deleteMany({});

    return NextResponse.json({
      message: "All course data cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing courses:", error);
    return NextResponse.json(
      { error: "Failed to clear courses" },
      { status: 500 }
    );
  }
}
