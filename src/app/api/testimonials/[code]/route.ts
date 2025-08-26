import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // Extract the 'code' parameter from the URL
        const url = req.nextUrl;
        const code = url.pathname.split("/").pop();  // Assuming 'code' is the last part of the URL path

        if (!code) {
            return NextResponse.json({ message: "Code parameter is required" }, { status: 400 });
        }

        // Query the feedback data based on the code
        const response = await prisma.feedback.findMany({
            where: {
                code: code,
            },
        });

        // Return the response as JSON
        return NextResponse.json(response);
    } catch (e: any) {
        // Check if error is an object and has a message property
        const errorMessage = e && e.message ? e.message : "Unknown error";

        console.error(errorMessage); // Log error message

        return NextResponse.json(
            { message: "Failed to get feedback", error: errorMessage },
            { status: 500 }
        );
    }
}
