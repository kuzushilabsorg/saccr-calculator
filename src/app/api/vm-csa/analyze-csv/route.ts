import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { OpenAIService } from "@/lib/vm-csa/openai-service";
import { DocumentUtils } from "@/lib/vm-csa/document-utils";
import { ClientCSVDataSchema, AnalysisResultSchema, DocumentType } from "@/lib/vm-csa/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csvFile") as File | null;
    const documentFile = formData.get("documentFile") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!csvFile) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 }
      );
    }

    if (!documentFile) {
      return NextResponse.json(
        { error: "No document file provided" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "No document ID provided" },
        { status: 400 }
      );
    }

    // Validate CSV file
    const validation = DocumentUtils.validateFile(csvFile, ["csv"]);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Validate document file
    const allowedTypes: DocumentType[] = ["pdf", "doc", "png", "jpg", "md"];
    const fileExtension = DocumentUtils.getFileExtension(documentFile.name);
    const documentType = DocumentUtils.extensionToDocumentType(fileExtension);

    if (!documentType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileExtension}. Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const docValidation = DocumentUtils.validateFile(documentFile, allowedTypes);
    if (!docValidation.valid) {
      return NextResponse.json(
        { error: docValidation.error },
        { status: 400 }
      );
    }

    // Extract content from the CSV file (we still need this as text)
    const csvContent = await csvFile.text();

    // Analyze the document file and CSV with OpenAI
    const analysisResult = await OpenAIService.analyzeDocumentAndCSV(
      documentFile,
      csvContent
    );

    // Create CSV data record
    const csvDataId = uuidv4();
    const csvData = ClientCSVDataSchema.parse({
      id: csvDataId,
      documentId: documentId,
      uploadDate: new Date().toISOString(),
      fileName: csvFile.name,
      fileSize: csvFile.size,
      analyzed: true,
    });

    // Create analysis result record
    const analysisId = uuidv4();
    const analysis = AnalysisResultSchema.parse({
      id: analysisId,
      documentId: documentId,
      csvDataId: csvDataId,
      analysisDate: new Date().toISOString(),
      recommendations: analysisResult.recommendations || [],
      summary: analysisResult.summary,
    });

    // In a real implementation, we would store these records in a database
    // For now, we'll just return them in the response

    return NextResponse.json({
      csvData,
      analysis,
    });
  } catch (error) {
    console.error("Error analyzing CSV:", error);
    return NextResponse.json(
      { error: "Failed to analyze CSV data" },
      { status: 500 }
    );
  }
}
