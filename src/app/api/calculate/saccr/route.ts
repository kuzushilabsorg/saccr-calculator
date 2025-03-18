import { NextRequest, NextResponse } from 'next/server';
import {
  calculateSACCR,
  convertFormToSACCRInput,
  parseCSVToSACCRInput,
} from '@/lib/saccr/calculator';
import formSchema, { csvUploadSchema } from '@/lib/saccr/schema';
import { SACCRInput, SACCRResult } from '@/lib/saccr/types';
import { ZodError } from 'zod';

/**
 * API handler for SACCR calculations
 * Supports both form data and CSV uploads
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let saccrInput: SACCRInput;

    if (contentType.includes('application/json')) {
      // Handle JSON form data
      const body = await request.json();

      try {
        // Validate form data
        const validatedData = formSchema.parse(body);
        saccrInput = convertFormToSACCRInput(validatedData);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              details: error.errors,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Handle CSV file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      // Check file type
      if (!file.name.endsWith('.csv')) {
        return NextResponse.json(
          { success: false, error: 'Only CSV files are supported' },
          { status: 400 }
        );
      }

      // Parse CSV file
      const csvText = await file.text();
      const csvRows = parseCSV(csvText);

      try {
        // Validate CSV data
        const validatedData = csvUploadSchema.parse(csvRows);
        saccrInput = parseCSVToSACCRInput(validatedData);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'CSV validation error',
              details: error.errors,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type' },
        { status: 415 }
      );
    }

    // Calculate SACCR
    let result: SACCRResult;
    try {
      result = calculateSACCR(saccrInput);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Calculation error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Return result
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error('SACCR calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Parse CSV text into an array of objects
 * @param csvText CSV text content
 * @returns Array of objects representing CSV rows
 */
function parseCSV(csvText: string): Record<string, string>[] {
  // Split by lines
  const lines = csvText.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      'CSV file must have a header row and at least one data row'
    );
  }

  // Parse header
  const headers = lines[0].split(',').map((header) => header.trim());

  // Parse data rows
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i} has ${values.length} columns, but header has ${headers.length} columns`
      );
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a CSV line, handling quoted values
 * @param line CSV line
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
        // Escaped quote within quoted value
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      // Add character to current value
      currentValue += char;
    }
  }

  // Add last value
  values.push(currentValue.trim());

  return values;
}
