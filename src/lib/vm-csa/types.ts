import { z } from "zod";

// Document types that can be uploaded
export const DocumentTypeSchema = z.enum([
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
  "md",
  "csv",
]);

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// VM-CSA document schema
export const VMCSADocumentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileType: DocumentTypeSchema,
  uploadDate: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  analyzed: z.boolean().default(false),
});

export type VMCSADocument = z.infer<typeof VMCSADocumentSchema>;

// CSV template schema
export const CSVTemplateSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  generatedDate: z.string(),
  columns: z.array(z.string()),
  description: z.string(),
});

export type CSVTemplate = z.infer<typeof CSVTemplateSchema>;

// Client CSV data schema
export const ClientCSVDataSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  uploadDate: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  analyzed: z.boolean().default(false),
});

export type ClientCSVData = z.infer<typeof ClientCSVDataSchema>;

// Analysis result schema
export const AnalysisResultSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  csvDataId: z.string(),
  analysisDate: z.string(),
  recommendations: z.array(
    z.object({
      type: z.enum(["continue", "review", "terminate", "other"]),
      description: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
    })
  ),
  summary: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// OpenAI analysis request schema
export const OpenAIAnalysisRequestSchema = z.object({
  documentContent: z.string(),
  csvContent: z.string().optional(),
  analysisType: z.enum(["document", "csv", "combined"]),
});

export type OpenAIAnalysisRequest = z.infer<typeof OpenAIAnalysisRequestSchema>;

// OpenAI analysis response schema
export const OpenAIAnalysisResponseSchema = z.object({
  csvTemplate: z.object({
    columns: z.array(z.string()),
    description: z.string(),
  }).optional(),
  recommendations: z.array(
    z.object({
      type: z.enum(["continue", "review", "terminate", "other"]),
      description: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
    })
  ).optional(),
  summary: z.string(),
});

export type OpenAIAnalysisResponse = z.infer<typeof OpenAIAnalysisResponseSchema>;
