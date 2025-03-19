import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { OpenAIService } from "@/lib/vm-csa/openai-service";
import { DocumentUtils } from "@/lib/vm-csa/document-utils";
import { DocumentType, VMCSADocumentSchema, CSVTemplateSchema } from "@/lib/vm-csa/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes: DocumentType[] = ["pdf", "doc", "png", "jpg", "md"];
    const fileExtension = DocumentUtils.getFileExtension(file.name);
    const documentType = DocumentUtils.extensionToDocumentType(fileExtension);

    if (!documentType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileExtension}. Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validation = DocumentUtils.validateFile(file, allowedTypes);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Analyze the document with OpenAI directly using the file
    const analysisResult = await OpenAIService.analyzeDocument(file);

    // Create document record
    const documentId = uuidv4();
    const document = VMCSADocumentSchema.parse({
      id: documentId,
      fileName: file.name,
      fileType: documentType,
      uploadDate: new Date().toISOString(),
      fileSize: file.size,
      contentType: file.type,
      analyzed: true,
    });

    // Create CSV template record
    const templateId = uuidv4();
    const csvTemplate = CSVTemplateSchema.parse({
      id: templateId,
      documentId: documentId,
      generatedDate: new Date().toISOString(),
      columns: analysisResult.csvTemplate?.columns || [],
      description: analysisResult.csvTemplate?.description || "",
    });

    // In a real implementation, we would store these records in a database
    // For now, we'll just return them in the response

    return NextResponse.json({
      document,
      csvTemplate,
      summary: analysisResult.summary,
    });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
