import { NextRequest, NextResponse } from "next/server";
import { DocumentUtils } from "@/lib/vm-csa/document-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const columns = searchParams.get("columns");
    
    if (!columns) {
      return NextResponse.json(
        { error: "No columns provided" },
        { status: 400 }
      );
    }
    
    // Parse the columns from the query parameter
    const columnArray = columns.split(",").map(col => col.trim());
    
    // Generate empty CSV template
    const csvContent = DocumentUtils.generateCSV(columnArray);
    
    // Set the response headers for file download
    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set("Content-Disposition", "attachment; filename=vm-csa-template.csv");
    
    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error generating CSV template:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV template" },
      { status: 500 }
    );
  }
}
