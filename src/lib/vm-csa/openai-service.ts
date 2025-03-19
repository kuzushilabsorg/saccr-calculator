import OpenAI from "openai";
import { OpenAIAnalysisRequest, OpenAIAnalysisResponse } from "./types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service for interacting with OpenAI API for VM-CSA document analysis
 */
export class OpenAIService {
  /**
   * Analyzes a VM-CSA document to generate a CSV template
   * @param file The VM-CSA document file
   * @returns The analysis response with CSV template
   */
  public static async analyzeDocument(
    file: File
  ): Promise<OpenAIAnalysisResponse> {
    try {
      // Convert the File to a Blob with the correct MIME type
      const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', fileBlob, file.name);
      
      // Call OpenAI with the file attachment
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial expert specializing in Variation Margin Credit Support Annex (VM-CSA) documents."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
TASK:
Analyze the attached VM-CSA document and create a CSV template that would allow a client to provide the necessary data for compliance assessment.

INSTRUCTIONS:
1. Identify the key data points that would be needed from a client to assess compliance with this specific VM-CSA.
2. Create a CSV template with appropriate columns.
3. For each column, provide a brief description of what data should be entered.
4. The CSV template should be comprehensive enough to capture all relevant information for compliance assessment.

YOUR RESPONSE SHOULD BE IN THE FOLLOWING JSON FORMAT:
{
  "csvTemplate": {
    "columns": ["column1", "column2", "column3", ...],
    "description": "Detailed description of the CSV template and how to fill it"
  },
  "summary": "A summary of your analysis of the VM-CSA document"
}
`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${await this.fileToBase64(file)}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      return this.parseResponse(completion.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error analyzing document with OpenAI:", error);
      throw new Error("Failed to analyze document with OpenAI");
    }
  }

  /**
   * Analyzes a VM-CSA document and client CSV data to generate recommendations
   * @param documentFile The VM-CSA document file
   * @param csvContent The content of the client CSV data
   * @returns The analysis response with recommendations
   */
  public static async analyzeDocumentAndCSV(
    documentFile: File,
    csvContent: string
  ): Promise<OpenAIAnalysisResponse> {
    try {
      // Convert the File to a Blob with the correct MIME type
      const fileBlob = new Blob([await documentFile.arrayBuffer()], { type: documentFile.type });
      
      // Call OpenAI with the file attachment and CSV content
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial expert specializing in Variation Margin Credit Support Annex (VM-CSA) documents."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
TASK:
Analyze the attached VM-CSA document and the client-provided CSV data to determine if the client's trading activities comply with the VM-CSA requirements. Provide recommendations on whether to continue trading with the client.

CLIENT CSV DATA:
${csvContent}

INSTRUCTIONS:
1. Compare the client's data against the requirements in the VM-CSA document.
2. Identify any discrepancies or compliance issues.
3. Assess the overall risk level of continuing to trade with this client.
4. Provide specific recommendations with reasoning.

YOUR RESPONSE SHOULD BE IN THE FOLLOWING JSON FORMAT:
{
  "recommendations": [
    {
      "type": "continue|review|terminate|other",
      "description": "Brief description of the recommendation",
      "riskLevel": "low|medium|high",
      "reasoning": "Detailed reasoning for this recommendation"
    },
    ...
  ],
  "summary": "A comprehensive summary of your analysis"
}
`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${documentFile.type};base64,${await this.fileToBase64(documentFile)}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      return this.parseResponse(completion.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error analyzing document and CSV with OpenAI:", error);
      throw new Error("Failed to analyze document and CSV with OpenAI");
    }
  }

  /**
   * Converts a File object to a base64 string
   * @param file The file to convert
   * @returns A Promise that resolves to the base64 string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Parses the OpenAI response into the expected format
   * @param response The response from OpenAI
   * @returns The parsed response
   */
  private static parseResponse(response: string): OpenAIAnalysisResponse {
    try {
      return JSON.parse(response) as OpenAIAnalysisResponse;
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      throw new Error("Failed to parse OpenAI response");
    }
  }
}
