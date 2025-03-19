import { DocumentType } from "./types";

/**
 * Utility functions for handling VM-CSA documents
 */
export class DocumentUtils {
  /**
   * Validates a file based on its type and size
   * @param file The file to validate
   * @returns An object indicating if the file is valid and any error message
   */
  public static validateFile(
    file: File,
    allowedTypes: DocumentType[]
  ): { valid: boolean; error?: string } {
    // Check file size (limit to 25MB - OpenAI's file size limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds the maximum limit of 25MB`,
      };
    }
    
    // Check file type
    const fileExtension = this.getFileExtension(file.name).toLowerCase() as DocumentType;
    if (!allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Gets the file extension from a filename
   * @param filename The filename to extract the extension from
   * @returns The file extension
   */
  public static getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
  }
  
  /**
   * Converts a file extension to a document type
   * @param extension The file extension
   * @returns The document type
   */
  public static extensionToDocumentType(extension: string): DocumentType | null {
    const ext = extension.toLowerCase();
    
    switch (ext) {
      case "pdf":
        return "pdf";
      case "doc":
      case "docx":
        return "doc";
      case "png":
        return "png";
      case "jpg":
      case "jpeg":
        return "jpg";
      case "md":
        return "md";
      case "csv":
        return "csv";
      default:
        return null;
    }
  }
  
  /**
   * Parses CSV content into an array of objects
   * @param csvContent The CSV content to parse
   * @returns An array of objects representing the CSV data
   */
  public static parseCSV(csvContent: string): Record<string, string>[] {
    // Split the CSV content into lines
    const lines = csvContent.split("\n");
    
    // Extract the header row
    const headers = lines[0].split(",").map(header => header.trim());
    
    // Parse the data rows
    const data = lines.slice(1).map(line => {
      const values = line.split(",").map(value => value.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      return row;
    });
    
    return data;
  }
  
  /**
   * Generates CSV content from a template and data
   * @param columns The column headers
   * @param data Optional data rows
   * @returns The generated CSV content
   */
  public static generateCSV(
    columns: string[],
    data: Record<string, string>[] = []
  ): string {
    // Generate the header row
    const headerRow = columns.join(",");
    
    // Generate the data rows
    const dataRows = data.map(row => {
      return columns.map(column => row[column] || "").join(",");
    });
    
    // Combine the header and data rows
    return [headerRow, ...dataRows].join("\n");
  }
}
